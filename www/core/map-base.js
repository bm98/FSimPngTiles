"use strict";
// --------------------------------------------------------
//
// (c) 2021 Martin Burri
// MIT License - no warranties whatsoever...
// https://github.com/bm98/FSimPngTiles
//
// --------------------------------------------------------

/*
  Moving Map Handling

  Provides:
   a map display (defaults to OSM but allows to add BING maps if a key is provided in Config.js)
   can center and track the aircraft based on lon/lot provided in a data file
   can lock the map and move the aircraft icon  (Toggle Tracking)
   can show distance rings around the aircraft (see Config.js to define the circles)
   enables the layerswitcher to change the base map and decorations

  Including this file creates a global map_obj  object
  Expects an init with map_obj.Init()
  Assumes CSS entries and an appropriate HTML page setup 
  Expects ol libraries available (ol.6.4.3 at the time of writing)
  Expects ol layerswitcher library available (ol-layerswitcher-3.8.3 at the time of writing)


  --
    indicated parts are inspired (borrowed) from the HTML V3.7.1 FlightAware WebDisplay pages
    see https://github.com/flightaware/dump1090
    This version of dump1090 is licensed under the GPL, v2 or later.
    Please see the individual source files and the file COPYING
    for full copyright and license details at the site mentioned above.
  --
  
  
  GPL License (c) 2020 M.Burri
  no warranties whatsoever ...
*/

// Map Object, properties and methods
function Map_obj()
{

// Get current map settings
  this.OLMap      = null;
  this.CenterLat, 
  this.CenterLon, 
  this.ZoomLvl, 
  this.MapType    = null;
  this.Layers     = null;

  this.PlaneIconFeatures  = new ol.Collection(); // plane icon
  this.StaticFeatures     = new ol.Collection(); // distance rings
  this.PlaneCircleFeatures = new ol.Collection(); // distance rings

  //Marker stuff
  this.marker       = null;
  this.markerStyle  = null;
  this.markerIcon   = null;
  this.markerStaticStyle = null;
  this.markerStaticIcon   = null;
  this.markerStyleKey     = null;
  this.markerSvgKey       = null;
  this.markerLonLat       = null;

  this.popup = null;
  this.lastIdent = '';

  this.procLock = false; // lockout unintended update for the markerLock
  this.markerSave     = true; 
  this.markerLocked   = true; // whether the aricraft marker is locked to the position or not

  // last values for position and heading
  this.lonLat = [0,0];
  this.thdg = 0.0;
  this.alt_msl_ft = 0.0;
  this.gs_kt = 0.0;
  this.vs_fpm = 0.0;
}

// INSTANCEs
const map_obj = new Map_obj();        // Map base


// Initalizes the map and starts up our timers to call various functions
Map_obj.prototype.init = function () 
{
  // Load stored map settings if present
  this.CenterLat = DefaultCenterLat;
  this.CenterLon = DefaultCenterLon;
  this.ZoomLvl = DefaultZoomLvl;
  this.MapType = localStorage['MapType'];
  this.Layers = this.createBaseLayers();
  this.createMapLayers(this.Layers);

  // Add the Aircraft icon 
  var iconsLayer = new ol.layer.Vector({
    name: 'aircraft_position',
    type: 'overlay',
    title: 'Aircraft position',
    visible: AircraftIcon,
    source: new ol.source.Vector({
        features: this.PlaneIconFeatures,
    })
});


  // Add the Distance Rings and other layers
  this.Layers.push( new ol.layer.Group({
      title: 'Overlays',
      layers: [
         // Distance rings
          new ol.layer.Vector({
              name: 'decoration',
              type: 'overlay',
              title: 'Decorations (range rings)',
              visible: SiteCircles,
              source: new ol.source.Vector({
                  features: this.StaticFeatures,
              })
          }),
          // other layers
          iconsLayer // and the ACFT icon layer
      ]
  }));


  // the MAP
  this.OLMap = new ol.Map({
    target: 'map_canvas',
    layers: this.Layers,
    numZoomLevels: 18,
    view: new ol.View({
        center: ol.proj.fromLonLat([this.CenterLon, this.CenterLat]),
        zoom: this.ZoomLvl
    }),
    controls: [new ol.control.Zoom(),
               new ol.control.Rotate(),
               new ol.control.Attribution({collapsed: true}),
               new ol.control.ScaleLine({units: "nautical"})
              ],
    loadTilesWhileAnimating: true,
    loadTilesWhileInteracting: true
  });
  // text popup
  var element = document.getElementById('mapPopup');
  this.popup = new ol.Overlay({
    element: element,
    positioning: 'bottom-center',
    stopEvent: false,
    offset: [0, -25],
    className: 'popup'
  });
  this.OLMap.addOverlay(this.popup);  

  // Add the layerswitcher - it will collect all layers from the map on it's own
  this.OLMap.addControl(new ol.control.LayerSwitcher());

  // Listeners for this map
  
  // Center pos has changed
  this.OLMap.getView().on('change:center', function(event) {
    var center = ol.proj.toLonLat(map_obj.OLMap.getView().getCenter(), map_obj.OLMap.getView().getProjection());
     // get the new center for later use
      map_obj.CenterLon = center[0]
      map_obj.CenterLat = center[1]
  });

  // Zoom has happend
  this.OLMap.getView().on('change:resolution', function(event) {
      map_obj.ZoomLvl = localStorage['ZoomLvl'] = map_obj.OLMap.getView().getZoom();
      // must update the markers and circles when zoomed
      map_obj.updateMarker(map_obj, false);
      map_obj.createCircleFeatures(map_obj.markerLonLat); // center is our Acft
  });

  // set startup tracking marker
  var marker = document.getElementById('track_aircraft_button_on');
  marker.style.display = 'block';
  marker = document.getElementById('track_aircraft_button_off');
  marker.style.display = 'none';
          
  // Set and refresh if initialized
  this.OLMap.getView().setCenter(ol.proj.fromLonLat([this.CenterLon, this.CenterLat]));
  this.OLMap.getView().setZoom(DefaultZoomLvl);

  this.Track(); // toggle the marker lock to unlocked

  // get data updates - register with dataReader
  dataReader.addDataProcessor('MAP', map_obj.UpdateMap, this);
}

// Update Map - Eventhandler registered at Init
//   simData: dataObject from upload
//   self: context delivered when registering the callback
Map_obj.prototype.UpdateMap = function ( simData, self ) 
{
  // sanity check the data
  simData.pos_lon = ( Math.abs(simData.pos_lon)<=180 ) ? simData.pos_lon : 0;
  simData.pos_lat = ( Math.abs(simData.pos_lat)<=90 ) ? simData.pos_lat : 0;
  simData.alt_msl_ft = ( Math.abs(simData.alt_msl_ft)<=60000 ) ? simData.alt_msl_ft : 0;
  simData.hdg_true_deg = ( simData.hdg_true_deg>=0 ) ? simData.hdg_true_deg : 0;
  simData.hdg_true_deg = ( simData.hdg_true_deg<=360 ) ? simData.hdg_true_deg : 0;
  simData.gs_kt =  ( simData.gs_kt>=0 ) ? simData.gs_kt : 0;

  // save for user interaction updates  
  self.lonLat =  [ simData.pos_lon, simData.pos_lat ];
  self.thdg = simData.hdg_true_deg; 
  self.alt_msl_ft = simData.alt_msl_ft;
  self.gs_kt = simData.gs_kt;
  self.vs_fpm = simData.vs_fpm;

  var moved  = true; // TODO determine movement to optimize drawing

  if (self.markerLocked){
    // if locked, move the center of the Map
    self.OLMap.getView().setCenter(ol.proj.fromLonLat( self.lonLat ));
  }
  // Update our marker  
  self.updateMarker(self, moved );
  // Update our distance rings
  if (moved){
    self.createCircleFeatures(self.lonLat);
  }
}


// Unlock and goto the given location
Map_obj.prototype.Goto = function (lon, lat) 
{
  this.markerLocked=false;
  var marker = document.getElementById('track_aircraft_button_on');
  marker.style.display = 'none';
  marker = document.getElementById('track_aircraft_button_off');
  marker.style.display = 'block';
  // goto
  this.OLMap.getView().setCenter(ol.proj.fromLonLat( [lon, lat] ));  
}

// Toggle Locking the aircraft icon
Map_obj.prototype.Track = function () 
{
  this.markerLocked=!this.markerLocked;
  if ( this.markerLocked ) {
    var marker = document.getElementById('track_aircraft_button_on');
    marker.style.display = 'block';
    marker = document.getElementById('track_aircraft_button_off');
    marker.style.display = 'none';
  }
  else {
    var marker = document.getElementById('track_aircraft_button_on');
    marker.style.display = 'none';
    marker = document.getElementById('track_aircraft_button_off');
    marker.style.display = 'block';
  }
}


// return the styling of the lines based on altitude
Map_obj.prototype.iconStyle = function(fixType, label) {

  return new ol.style.Style({
    image: new ol.style.Icon({ src: this.fpIcons[fixType], scale: 1.5}),
    text: new ol.style.Text({
      font: 'bold 16px Arial, sans-serif',
      fill: new ol.style.Fill({ color: '#1010f0' }),
      backgroundFill: new ol.style.Fill({ color: '#d0c0d0' }),
      offsetY: -20,
      placement: 'point', 
      padding: [1,3,0,3],
      textAlign: 'center',
      text: label
    })
});
}

// return the styling of the lines based on altitude
Map_obj.prototype.altitudeLines = function(altitude) {
  var colorArr = this.getAltitudeColor(altitude);
  return new ol.style.Style({
      stroke: new ol.style.Stroke({
          color: 'hsl(' + (colorArr[0]/5).toFixed(0)*5 + ',' + (colorArr[1]/5).toFixed(0)*5 + '%,' + (colorArr[2]/5).toFixed(0)*5 + '%)',
          width: 5
      })
  })
}

// parts below are inspired (borrowed) from the HTML V3.7.1 FlightAware WebDisplay pages
// 


// parts below are inspired (borrowed) from the HTML V3.7.1 FlightAware WebDisplay pages
// 

// Make a LineString with 'points'-number points
// that is a closed circle on the sphere such that the
// great circle distance from 'center' to each point is
// 'radius' nm
Map_obj.prototype.make_geodesic_circle = function (center, radius, points) 
{
    var conversionFactor = 1852.0; // m per nm
    var angularDistance = radius * conversionFactor / 6378137.0; // Earth Radius nm
    var lon1 = center[0] * Math.PI / 180.0;
    var lat1 = center[1] * Math.PI / 180.0;
    var geom = new ol.geom.LineString( []); //20190824 init
    for (var i = 0; i <= points; ++i) {
        var bearing = i * 2 * Math.PI / points;

        var lat2 = Math.asin( Math.sin(lat1)*Math.cos(angularDistance) +
                              Math.cos(lat1)*Math.sin(angularDistance)*Math.cos(bearing) );
        var lon2 = lon1 + Math.atan2(Math.sin(bearing)*Math.sin(angularDistance)*Math.cos(lat1),
                                     Math.cos(angularDistance)-Math.sin(lat1)*Math.sin(lat2));

        lat2 = lat2 * 180.0 / Math.PI;
        lon2 = lon2 * 180.0 / Math.PI;
        geom.appendCoordinate([lon2, lat2]);
    }
    return geom;
}


// Create the Distance Circles around the Aircraft Icon
Map_obj.prototype.createCircleFeatures = function ( lonLat ) {
    // Clear existing circles first
    var self = this;
    this.PlaneCircleFeatures.forEach(function(circleFeature) {
      self.StaticFeatures.remove(circleFeature); 
    });
    this.PlaneCircleFeatures.clear();

    var circleStyle = function(distance) {
        return new ol.style.Style({ 
          fill: null, stroke: new ol.style.Stroke({ color: OutlineRingColor, width: 2 }),
          text: new ol.style.Text({
            font: '16px Arial, sans-serif',
            fill: new ol.style.Fill({ color: OutlineRingColor }),
                offsetY: -12,
                text: distance.toString()+ " NM"

            })
        });
    };
    // create circles from the Config Array (SiteCirclesDistances) of distances
    for (var i=0; i < SiteCirclesDistances.length; ++i) {
        var distance = SiteCirclesDistances[i];
        var circle = this.make_geodesic_circle(lonLat, distance, 360);
        circle.transform('EPSG:4326', 'EPSG:3857');
        var feature = new ol.Feature(circle);
        feature.setStyle(circleStyle(distance));
        this.StaticFeatures.push(feature);
        this.PlaneCircleFeatures.push(feature);
    }
}


// Update our marker on the map
//  self: owning obj
//  moved:  Flag indicates movement since last call
Map_obj.prototype.updateMarker = function(self, moved) 
{
  this.markerLonLat = this.lonLat;  // new location
  const vsString = ((this.vs_fpm>0)? "↑ " : (this.vs_fpm<0)? "↓ " : "→ ") + this.vs_fpm.toFixed(0) + " FPM";

  this.updateIcon(this.thdg); // get the proper icon with orientation
  if (this.marker) {
      if (moved) {
        // update only if moved is true
          this.marker.setGeometry(new ol.geom.Point(ol.proj.fromLonLat(this.lonLat)));
          this.markerStatic.setGeometry(new ol.geom.Point(ol.proj.fromLonLat(this.lonLat)));
          this.markerStaticStyle = new ol.style.Style({text: new ol.style.Text({
            font: '16px Arial, sans-serif',
            fill: new ol.style.Fill({ color: '#000000' }),
            backgroundFill: new ol.style.Fill({ color: '#10d0c0d0' }),
            offsetY: +50,
            placement: 'point', 
            padding: [1,3,0,3],
            textAlign: 'center',
            text: this.alt_msl_ft.toFixed(0) + " FT\n" + this.gs_kt.toFixed(0) + " KT\n" + vsString
          })
        });
        this.markerStatic.setStyle( this.markerStaticStyle );
      }
  } else {
      this.marker = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(this.lonLat)));
      this.marker.setStyle(this.markerStyle);
      this.PlaneIconFeatures.push(this.marker);

      this.markerStatic = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(this.lonLat)));
      this.markerStatic.setStyle(this.markerStaticStyle);
      this.PlaneIconFeatures.push(this.markerStatic);
  }
};

// Update the aircraft icon on the map
//  thdg: True Heading of the aircraft
Map_obj.prototype.updateIcon = function(thdg) 
{
  var scaleFactor = Math.max(0.2, Math.min(1.2, 0.15 * Math.pow(1.25, this.ZoomLvl))).toFixed(1);

  var col = this.getMarkerColor();
  var opacity = 1.0;
  var outline = OutlineAircraftColor;
  var add_stroke = ' stroke="black" stroke-width="1px"';
  var baseMarker = this.getMarker( );
  var rotation = thdg;

  var svgKey = col + '!' + outline + '!' + baseMarker.svg + '!' + add_stroke + "!" + scaleFactor;
  var styleKey = opacity + '!' + rotation;

  if (this.markerStyle === null || this.markerIcon === null || this.markerSvgKey != svgKey) {
      var icon = new ol.style.Icon({
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          scale: 1.2 * scaleFactor,
          imgSize: baseMarker.size,
          src: this.svgPathToURI( baseMarker.svg, outline, col, add_stroke ),
          rotation: rotation * Math.PI / 180.0,
          opacity: opacity,
          rotateWithView: true
      });

      this.markerIcon = icon;
      this.markerStyle = new ol.style.Style({
          image: this.markerIcon
      });
      this.markerStaticIcon = null;
      this.markerStaticStyle = new ol.style.Style({});

      this.markerStyleKey = styleKey;
      this.markerSvgKey = svgKey;

      if (this.marker !== null) {
          this.marker.setStyle( this.markerStyle );
          this.markerStatic.setStyle( this.markerStaticStyle );
      }
  }

  if (this.markerStyleKey != styleKey) {
      this.markerIcon.setRotation( rotation * Math.PI / 180.0 );
      this.markerIcon.setOpacity( opacity );
      if (this.staticIcon) {
          this.staticIcon.setOpacity( opacity );
      }
      this.markerStyleKey = styleKey;
  }

  return true;
};

// fudge with SVG content to colorize it
Map_obj.prototype.svgPathToSvg = function (path, stroke, fill, selected_stroke) 
{
  path = path.replace('aircraft_color_fill', fill).replace('aircraft_color_stroke', stroke).replace('add_stroke_selected', selected_stroke);
  return path;
}

// fudge with SVG content to make it OL compliant
Map_obj.prototype.svgPathToURI =  function (path, stroke, fill, selected_stroke) 
{
  return "data:image/svg+xml;base64," + btoa(this.svgPathToSvg(path, stroke, fill, selected_stroke));
}

// Get a color for this marker (ALT based)
Map_obj.prototype.getMarkerColor = function() 
{

  var h, s, l;
  var colorArr = this.getAltitudeColor();
  h = colorArr[0];
  s = colorArr[1];
  l = colorArr[2];

  // If this marker is selected, change color
  h += ColorByAlt.selected.h;
  s += ColorByAlt.selected.s;
  l += ColorByAlt.selected.l;

  if (h < 0) {
          h = (h % 360) + 360;
  } else if (h >= 360) {
          h = h % 360;
  }

  if (s < 5) s = 5;
  else if (s > 95) s = 95;

  if (l < 5) l = 5;
  else if (l > 95) l = 95;

  return 'hsl(' + (h/5).toFixed(0)*5 + ',' + (s/5).toFixed(0)*5 + '%,' + (l/5).toFixed(0)*5 + '%)'
}

// Get an Alt Color from the Alt HeatMap
Map_obj.prototype.getAltitudeColor = function( altitude ) 
{
  var h, s, l;

  if (typeof altitude === 'undefined') {
      altitude = this.alt_msl_ft;
  }

  if (altitude === null) {
      h = ColorByAlt.unknown.h;
      s = ColorByAlt.unknown.s;
      l = ColorByAlt.unknown.l;
  } else if (this.altitude === "ground") {
      h = ColorByAlt.ground.h;
      s = ColorByAlt.ground.s;
      l = ColorByAlt.ground.l;
  } else {
      s = ColorByAlt.air.s;
      l = ColorByAlt.air.l;

      // find the pair of points the current altitude lies between,
      // and interpolate the hue between those points
      var hpoints = ColorByAlt.air.h;
      h = hpoints[0].val;
      for (var i = hpoints.length-1; i >= 0; --i) {
          if (altitude > hpoints[i].alt) {
              if (i == hpoints.length-1) {
                  h = hpoints[i].val;
              } else {
                  h = hpoints[i].val + (hpoints[i+1].val - hpoints[i].val) * (altitude - hpoints[i].alt) / (hpoints[i+1].alt - hpoints[i].alt)
              }
              break;
          }
      }
  }

   if (h < 0) {
          h = (h % 360) + 360;
  } else if (h >= 360) {
          h = h % 360;
  }

  if (s < 5) s = 5;
  else if (s > 95) s = 95;

  if (l < 5) l = 5;
  else if (l > 95) l = 95;

  return [h, s, l];
};

// Aircraft Icon SVG
Map_obj.prototype.getMarker = function( ) 
{
  return {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="17px" height="17px"  add_stroke_selected><defs><style>.cls-1{fill:aircraft_color_fill;}.cls-2{fill:aircraft_color_stroke;}</style></defs><title>Aircraft</title><g id="Layer_2" data-name="Layer 2"><g id="Aircraft"><path class="cls-1" d="M5.25,16.76c-.92,0-1.33-.46-1.39-.86a1,1,0,0,1,.79-1.11c.25-.08,1.22-.43,2.63-1V10.65h-6c-.68,0-1-.35-1-.66a.81.81,0,0,1,.6-.86C1.14,9,4.8,7,7.28,5.63V3c0-1.11.44-2.71,1.23-2.71S9.77,1.84,9.77,3V5.63C12.22,7,15.87,9,16.14,9.13a.8.8,0,0,1,.61.86c-.05.31-.36.67-1.05.67H9.77v3.19l1.61.59,1,.36a1.05,1.05,0,0,1,.8,1.11c-.07.39-.47.86-1.39.86Z"/><path class="cls-2" d="M8.54.48c.55,0,1,1.36,1,2.47V5.77s6.15,3.45,6.53,3.59c.72.25.61,1.06-.36,1.06H9.53V14c1.44.52,2.5.93,2.76,1,1,.36.85,1.5-.52,1.5H5.25c-1.38,0-1.52-1.14-.52-1.5.26-.08,1.33-.47,2.78-1V10.41H1.29c-1,0-1-.81-.36-1.06.4-.13,6.59-3.59,6.59-3.59V3c0-1.11.44-2.47,1-2.47h0m0-.48h0C7.51,0,7,1.76,7,3V5.49C4.69,6.79,1.11,8.77.77,8.9A1,1,0,0,0,0,10a1.15,1.15,0,0,0,1.27.86H7v2.78c-1.3.49-2.23.82-2.45.89a1.29,1.29,0,0,0-1,1.39c.08.49.56,1.05,1.63,1.05h6.51c1.07,0,1.54-.57,1.63-1.05a1.28,1.28,0,0,0-.94-1.38l-1-.36L10,13.67V10.89h5.7A1.16,1.16,0,0,0,17,10a1,1,0,0,0-.77-1.12C15.9,8.77,12.34,6.79,10,5.49V3c0-1.19-.47-3-1.47-3Z"/></g></g></svg>',
      size: [17,17]
  }
}
