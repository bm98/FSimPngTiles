"use strict";
// --------------------------------------------------------
//
// (c) 2021 Martin Burri
// MIT License - no warranties whatsoever...
// https://github.com/bm98/FSimPngTiles
//
// This file is to change the configurable settings.
//   overwrites ./core/config.js settings here
//
// --------------------------------------------------------

// The server for any raster tiles - 
// Set to the IP where the service is running - either your PC, or a NAS IP when running as Docker image
MapTileService= "http://192.168.1.69:8081/"

// -- Map settings ----------------------------------------
// The maps initial zoom level, 0 - 16, lower is further out
DefaultZoomLvl  = 10;

// Aircraft marker distance rings (default only)  [set true or false]
AircraftIcon = true; // true to start with show icon (only shown if the center marker is shown)
SiteCircles = true; // true to start with show circles (only shown if the center marker is shown)

// Circles around the aircraft icon shown in the map
// Numbers are the Radius and in nautical miles
// default: SiteCirclesDistances = new Array(2, 5, 10, 20);
SiteCirclesDistances = new Array(2, 5, 10, 20);
// Outline color for distance rings
OutlineRingColor = '#202000';
// Outline color for aircraft icon
OutlineAircraftColor = '#000000';

// Provide a Bing Maps API key here to enable the Bing imagery layer.
// You can obtain a free key (with usage limits) at
// https://www.bingmapsportal.com/ (you need a "basic key")
//
// Be sure to quote your key:
//   BingMapsAPIKey = "your key here";
//
BingMapsAPIKey = null;
