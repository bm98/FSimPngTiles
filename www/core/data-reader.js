"use strict";
// --------------------------------------------------------
//
// (c) 2021 Martin Burri
// MIT License - no warranties whatsoever...
// https://github.com/bm98/FSimPngTiles
//
// --------------------------------------------------------
/*
  Live FSim Data Handling

  initiates an update event
  collects a data file from the designated folder 
  dispatches updates to registered consumers
   
  to create the event handler use:
   DataReader_obj.createDataTick(framerate); 

   register consumers with:
   DataReader_obj.addDataProcessor(id, callback, context)

   unregister consumers with:
   DataReader_obj.removeDataProcessor(id)
*/

function DataReader_obj(filename){
  this._tickerExists = false,
  this._callbacks = [], // processors
  this._xdata = {},   // json data object uploaded 
  this.uploadfile = filename;
  this.intervall = 10; // 1sec we run at 100msec
  this.ticker = 0;
}

// create 3 data readers for the Data,Static,FPlan files
const dataReader = new DataReader_obj('dummy'); 

  // Start a ticker to read the datafile and update registered clients
  //  framerate: update rate per sec (defaults to 1/sec)
  DataReader_obj.prototype.createDataTick = function(frameRate=1)
  {
    if ( this._tickerExists) return; // already

    // sanity
    if (frameRate>5) frameRate = 5;     // fastest is 200ms
    if (frameRate<0.1) frameRate = 0.1; // slowest is 10 sec

    this.intervall = 10 / frameRate; // 10 fps base 

    // setup the display refresh when a datafile is provided
    // THERE IS ONLY ONE FRAMERATE... so we need to throttle ourselves
    createjs.Ticker.framerate = 10; // The base fps is 10/sec 
    createjs.Ticker.on("tick", this._handleDataUpdate, null, false, this);  
    this._tickerExists = true;
  },

  // add a processor for the datafile
  //  id: a unique name
  //  func: callback_function ( jsonData, context )
  //  context: self
  DataReader_obj.prototype.addDataProcessor = function ( id, func, context)
  {
    this._callbacks.push({'id':id, 'func': func, 'context': context });
  },

  // remove a processor for the datafile that was registered with id
  //  id: the registered name
  DataReader_obj.prototype.removeDataProcessor = function ( id )
  {
    var idx = this._callbacks.findIndex( element => element.id === id );
    if (idx>=0){
      this._callbacks.splice(idx,1); // remove the element
    }
  },

  // Event handler for Tick - initiates a data update from file
  //  evt: easeljs timer event
  //  self: context sent when registering the event
  DataReader_obj.prototype._handleDataUpdate = function (evt, self) {
    // Actions carried out each tick (aka frame)
    if (( self.ticker++ % self.intervall) > 0) return; // only act on MOD = 0 

    if (!evt.paused) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          self._xdata = JSON.parse(this.responseText); // get the data from an uploaded file
          // exec registered processors
          self._callbacks.forEach(element => {
            element.func(self._xdata, element.context);
          });
        }
      };
      // see main.js on how the query is expected
      xmlhttp.open("GET", '/api/location' ,true);
      xmlhttp.send();
    }
  }

