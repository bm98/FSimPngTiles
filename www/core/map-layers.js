"use strict";
// --------------------------------------------------------
//
// (c) 2021 Martin Burri
// MIT License - no warranties whatsoever...
// https://github.com/bm98/FSimPngTiles
//
// --------------------------------------------------------
/*
  Moving Map Handling - layer setup

  parts are inspired (borrowed) from the HTML V3.7.1 FlightAware WebDisplay pages
  defaults to OSM but allows to add BING maps if a key is provided in Config.js
  
*/

// Base layers configuration
Map_obj.prototype.createBaseLayers = function () 
{
    var layers = [];
    var world = [];

    // If there is a valid Key in the Config File
    if (BingMapsAPIKey) {
        world.push(new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: BingMapsAPIKey,
                imagerySet: 'Road'
            }),
            name: 'bing_roads',
            title: 'Bing Roads',
            type: 'base',
        }));

        world.push(new ol.layer.Tile({
          source: new ol.source.BingMaps({
              key: BingMapsAPIKey,
              imagerySet: 'Aerial'
          }),
          name: 'bing_aerial',
          title: 'Bing Aerial',
          type: 'base',
      }));
    }
    
    // Stamen OSM
    world.push(new ol.layer.Tile({
      source: new ol.source.Stamen({ 
        layer: 'terrain'
      }),
      name: 'stamen',
      title: 'Terrain',
      type: 'base',
    }));


    // Basic Map is OSM
    world.push(new ol.layer.Tile({
      source: new ol.source.OSM(),
      name: 'osm',
      title: 'OpenStreetMap',
      type: 'base',
    }));


    if (world.length > 0) {
        layers.push(new ol.layer.Group({
            name: 'world',
            title: 'Worldwide',
            layers: world
        }));
    }

    
    return layers;
}

// Map layers configuration
Map_obj.prototype.createMapLayers= function (layers) 
{
  if ( layers === null ) return;

  var pngLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
      //imageSmoothing: false,
      // the Config.js defines the MapTile Service - the route PNG leads to the PNG map delivery
      url: MapTileService + 'PNG/{z}/{x}/{y}.jpg', // TMS tiles need -y for bottom left origin (oposed to Google Map)
      attributions: ['; PNG Map: Courtesy of the University of Texas Libraries'],
      // Use the local filesystem url below if the tiles are stored in the data folder and not taken from a TileServer
      //   url: DataFolder + '/tiles/PNGmap/{z}/{x}/{-y}.jpg', // TMS tiles need -y for bottom left origin (oposed to Google Map)
    }),
    maxZoom: 12,
    minZoom:  6,
    name: 'pngMap',
    title: 'PNG Map',
    type: 'overlay',
    opacity: 0.9 // some transparency
  });


  layers.push(new ol.layer.Group({
    title: 'Local Maps',
    layers: [
      pngLayer
    ]
  })); 

 
  return layers;

}
