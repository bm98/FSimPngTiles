# PNG Tiles Project

Providing an easy way to have PNG (Papua New Guinea) Map tiles for mostly Flight Simulator use.  
The project started while discovering PNG with FS2020. OSM provides only limited coverage and no particular details about mountains etc.  

The contained files are used to create a Docker Image:  bm98ch/fsimpngtiles
which provides a tile server and a mapping web app.  

https://hub.docker.com/r/bm98ch/fsimpngtiles  

Information about how and what are in the PDF (HowTo...) and should help to get started.  
https://github.com/bm98/FSimPngTiles/blob/main/HowTo-V0.9.pdf  


The services are composed from Node.js components and some tinkering with Javascript.  
The tileserver is a tilelive/tessera Tile Server and is used to provide tiles for open layers web apps.  
A mapping app is included – to be found at port 8080. It also accepts tracking GET requests at the route /api/track
      
### TO BE USED ONLY FOR PERSONAL ENJOYMENT (and Flight Simulator use may be…)  
*** Never use these maps for real world purposes - they are from the 1980 - 1990 area and mostly outdated by now.

---

### Quick Guide

See HowTo PDF file.
https://github.com/bm98/FSimPngTiles/blob/main/HowTo-V0.9.pdf  

---

#### Credits

Original PNG Maps are:
“Courtesy of the University of Texas Libraries, The University of Texas at Austin.”   
I assume they are public domain as this was stated in the Universities copyright section.

Node.js Tilelive, Tessera from the corresponding OS projects   

Some inspiration and openlayer snips were taken from the FlightAware dump1090 GUI   
Previous tinkering with it https://github.com/bm98/dump1090-html_2


OSGeoLive on Linux VM (https://live.osgeo.org) applications used: QGIS Desktop (https://qgis.org) MapSlicer using GDAL libraries  ()

Realworld PNG flying can be seen here https://www.youtube.com/c/MissionarybushPilot/featured
