"use strict";
//
// (c) 2021 Martin Burri
// MIT License - no warranties whatsoever...
// https://github.com/bm98/FSimPngTiles
//
// V 0.9
// Server side Node.JS Code for the map display 
// --> In general there is nothing to change in this file for standard usage
//
//  This implements a WebServer able to:
//   - serve a map from OSM
//   - serve a map from local tiles
//   - accept a PUT request for an icon to show at lat lon on the map
//   - accept a PUT request to center at lat lon on the map
//
// Setup:
//  Install Node.JS  (https://nodejs.org/en/download/)
//  Issue in e.g. powershell (Windows)
//  $ npm install 
//
//  Adjust the server ports below  (var port = NNNNN)
//
// Run:
//  Issue in e.g. powershell (Windows)
//  $ npm run start
//  .. to run the server
//

// The listening port of the HTTP Server
const port = 8080;

// web folder structure to be known by the methods below
// The main folder where the public HTML content is located
const publicHtml = 'www';

// Adjust from here but beware..

// Import express und http Module. 
const express = require('express');
const path = require('path');

var app = express();
var server = require('http').createServer(app);

// define web root
const webRoot = path.join( __dirname, publicHtml ); // current folder + our public one

// tracking vars
var lat = -6.0;
var lon = 146.0;
var alt = 8000.0;
var hdg = 0.0;
var gs = 120;
var vs = 0;


// Start the simple Webserver
server.listen(port, function () {
  // Greeting for service startup
  console.log('Docker image: bm98ch/fsimpngtiles');
  console.log('Simple Map Server running, listens at port %d', port);
});

// Setup the 'public' WebSite Files path
app.use(express.static(webRoot));


// Return the requested coords for the map script
/*
Route path: /location
Request URL: http://localhost:PORT/api/location
*/
app.get('/api/location' , function (req, res) {    
    //console.log('DEB: location Called! '); // DEBUG
    const retObj = '{"pos_lon":' +lon+ ',"pos_lat":' +lat+ ',"alt_msl_ft":' +alt+ ',"hdg_true_deg":' +hdg+ ',"gs_kt":'+gs+ ',"vs_fpm":' +vs+ '}';
    res.send(retObj); // Reply with records
});

// Require a location to track 
/*
Route path: /api/track/:ACFT_DATA  (lat, lon, alt_msl, true heading, groundspeed, vertical rate)
Get URL: http://localhost:PORT/api/track/12.3,-12.5,2300,256,120,-200
*/
app.get('/api/track/:ACFT_DATA', function (req, rep) {
    //console.log('DEB: GET track/__ Called! ' + req.params.ACFT_DATA); // DEBUG
    const para = req.params.ACFT_DATA.split(',');
    if ( para.length<2) {
      console.log('ERR: track - parameter should be at least lat,lon ');
      rep.status(500).send('Error: Parameter error - try again');
      return;
    }
    // sanity
    if ( isNaN(para[0]) || isNaN(para[1]) ) {
      console.log('ERR: track - lat lon paramater should be numbers ');
      rep.status(500).send('Error: Parameter lat or lon is not a number - try again');
      return;
    }
    lat = para[0];
    lon = para[1];
    // sanity for any optional data
    if ( para.length>2  && !isNaN(para[2])) alt= para[2];
    if ( para.length>3  && !isNaN(para[3])) hdg= para[3];
    if ( para.length>4  && !isNaN(para[4])) gs= para[4];
    if ( para.length>5  && !isNaN(para[5])) vs= para[5];

    //console.log('Center coords received'); // DEBUG
    rep.send('Center coords received'); // reply to sender
});

