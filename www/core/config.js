// --------------------------------------------------------
//
// (c) 2021 Martin Burri
// MIT License - no warranties whatsoever...
// https://github.com/bm98/FSimPngTiles
//
// This file is to configure the configurable settings.
// Load this file before any other non library scripts
//
// --------------------------------------------------------

// The server for any raster tiles 
MapTileService= "http://127.0.0.1:8081/"

// Provide a Bing Maps API key here to enable the Bing imagery layer.
// You can obtain a free key (with usage limits) at
// https://www.bingmapsportal.com/ (you need a "basic key")
//
// Be sure to quote your key:
//   BingMapsAPIKey = "your key here";
//
BingMapsAPIKey = null;


// -- Map settings ----------------------------------------
// These settings are overridden by any position information
// All positions are in decimal degrees.

// Default center of the map. Just to have one...
DefaultCenterLat = -6.0;
DefaultCenterLon = 146.0;
// The maps initial zoom level, 0 - 16, lower is further out
DefaultZoomLvl   = 10;

// Aircraft marker distance rings (default only)
AircraftIcon = true; // true to start with show icon (only shown if the center marker is shown)
SiteCircles = true; // true to start with show circles (only shown if the center marker is shown)

// Circles around the aircraft icon shown in the map
// Numbers are the Radius and in nautical miles
// default: SiteCirclesDistances = new Array(2, 5, 10, 20);
SiteCirclesDistances = new Array(2, 5, 10, 20);

// Outline color for aircraft icon
OutlineAircraftColor = '#000000';
// Outline color for distance rings
OutlineRingColor = '#202000';

// The base width for pages - the App will scale to this with
PagesBaseWidth = 1366;
PagesBaseHeight = PagesBaseWidth * (780/1366); // Aspect of the pages main area

// -- Aircraft icon settings -------------------------------------
// Borrowed as is from: the HTML V3.7.1 FlightAware WebDisplay pages

// These settings control the coloring of aircraft by altitude.
// All color values are given as Hue (0-359) / Saturation (0-100) / Lightness (0-100)
ColorByAlt = {
        // HSL for planes with unknown altitude:
        unknown : { h: 0,   s: 0,   l: 40 },

        // HSL for planes that are on the ground:
        ground  : { h: 15, s: 80, l: 20 },

        air : {
                // These define altitude-to-hue mappings
                // at particular altitudes; the hue
                // for intermediate altitudes that lie
                // between the provided altitudes is linearly
                // interpolated.
                //
                // Mappings must be provided in increasing
                // order of altitude.
                //
                // Altitudes below the first entry use the
                // hue of the first entry; altitudes above
                // the last entry use the hue of the last
                // entry.
                h: [ { alt: 2000,  val: 20 },    // orange
                     { alt: 10000, val: 140 },   // light green
                     { alt: 40000, val: 300 } ], // magenta
                s: 85,
                l: 50,
        },

        // Changes added to the color of the currently selected plane
        selected : { h: 0, s: -10, l: +20 },

        // Changes added to the color of planes that have stale position info
        stale :    { h: 0, s: -10, l: +30 },

        // Changes added to the color of planes that have positions from mlat
        mlat :     { h: 0, s: -10, l: -10 }
};

