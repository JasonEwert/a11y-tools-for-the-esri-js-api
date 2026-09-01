class KeyboardAssistant{
    
    //////////////////////////////////////////////////////////////////////
    //                                                                  //
    // Keyboard access to map clicks!                                   //
    //                                                                  //
    // Open the map's popups at the center of the map view using the    //
    // space or enter key.                                              //
    //                                                                  //
    // Handle plus, minus, and arrow key interactions. Panning          //
    // distances are adjusted to make feature selection possible.       //
    //                                                                  //
    // WCAG 2.1 character key inputs - single key inputs only active    //
    // when UI element has focus.                                       //
    // www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html //
    //                                                                  //
    // Requirements:                                                    //
    // Esri JS API v5.1 & the arcgis-map component                      //
    // Tested with: 5.1 July 2026                                       //
    //                                                                  //
    // myMap   - Required. The arcgis-map component.                    //
    // myPopup - Optional. The arcgis-popup component.                  //
    // For example, the following adds a new instance of this class.    //
    // new KeyboardAssistant( document.querySelector("arcgis-map") );   //
    // Use of the arcgis-popup component allows you to set an aria-live //
    // region. aria-live="polite"                                       //
    //                                                                  //
    // Developed by: MNIT in partnership with the Minnesota Pollution   //
    // Control Agency. (Jason Ewert & jennifer Strahan)                 //
    //                                                                  //
    //////////////////////////////////////////////////////////////////////
    
    constructor(myMap, myPopup){

        require([
            "esri/layers/GraphicsLayer",
            "esri/Graphic",
            "esri/geometry/Point",
            "esri/core/reactiveUtils",
        ], (
            GraphicsLayer,
            Graphic,
            Point,
            reactiveUtils
        ) => {  
            
            /*****************************************************************
            * add the map center point graphics layer the map
            *****************************************************************/

            // symbols used by addMapCenterGraphic()
            const markerSym = {
                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                color: [0, 0, 0, 0],
                style: 'circle',
                outline: {
                    color: [0,0,0], //color: [52,58,64],
                    width: 2
                },
                size: 20
            };

            const crossSym = {
                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                color: [0,0,0,0],
                style: 'cross',
                outline: {
                    color: [0,0,0], //color: [52,58,64],
                    width: 1
                },
                size: 10
            };

            const mapCenterGraphic = new GraphicsLayer({
                id: "mapCenterGraphic",
                listMode: "hide"
            });

            myMap.map.add(mapCenterGraphic)
            
            /*****************************************************************
            * create the instructions div
            *****************************************************************/

            const userNoteInfo = document.createElement("div");                
            userNoteInfo.className = "userNote";
            userNoteInfo.innerHTML="<h3 style='padding-left: 15px'>Keyboard navigation</h3>"
                + "<ol><li> Use <b>arrows</b> to center the map.</li>"
                + "<li>Press the <b>plus</b> or <b>equals</b> key to zoom in.</li>"
                + "<li>Press the <b>minus</b> key to zoom out.</li>"
                + "<li>Press the <b>enter</b> or <b>space bar</b> key to query the map.</li>"
                + "<li>Press <b>shift i</b> to turn off the keyboard access tools.</li>"
                + "</ol>";
            userNoteInfo.classList.add("esri-widget");
            userNoteInfo.setAttribute('tabindex', '0'); 
            userNoteInfo.setAttribute('aria-live', 'polite'); 
            userNoteInfo.setAttribute('style', 'padding-right: 20px');  
            // Please forgive the inline styles, it makes for a cleaner package.
            
            /*****************************************************************
            * handle key down and key up events for map pan, zoom, and query
            *****************************************************************/

            //set the "hot" keys 
            const mapKeys = ["Enter", " ","ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown","-", "=", "+", "I"];

            myMap.view.on('key-down', function (event) {
                
                const keyPressed = event.key;

                if ( mapKeys.indexOf(keyPressed) >= 0 ) {
                    
                    // Disable built-in ESRI keyboard navigation so that we can override with smaller steps.
                    if (keyPressed.slice(0, 5) === 'Arrow') {
                        event.stopPropagation();
                    }

                    // If the center graphic doesn't exist, add teh graphic and hotkey instructions.
                    if (mapCenterGraphic.graphics.length === 0 && keyPressed != 'I'){
                        addMapCenterGraphic();
                        myMap.view.ui.add(userNoteInfo, "top-right");
                    }
                }
                
            });

            myMap.view.on("key-up", (event) => {

                const keyPressed = event.key	
                const lat = myMap.view.center.latitude
                const lon = myMap.view.center.longitude   
                const zoomL = myMap.view.zoom
                
                // fine tune the pan distance by scale range.
                // these numbers work fairly well, it would be cool if this was settable by the user. 

                let distance
                const distancefactor = 1 // adjust the pan distance at all scales.

                if(zoomL < 6){
                    distance = 0.2 * distancefactor
                } else if (zoomL >=6 && zoomL < 7){
                    distance = 0.16 * distancefactor
                } else if (zoomL >=7 && zoomL < 8){
                    distance = 0.08 * distancefactor
                } else if (zoomL >=8 && zoomL < 10){
                    distance = 0.02 * distancefactor
                } else if (zoomL >=10 && zoomL < 12){
                    distance = 0.004 * distancefactor
                } else if (zoomL >=12 && zoomL < 13){
                    distance = 0.002 * distancefactor
                } else if (zoomL >=13 && zoomL < 14){
                    distance = 0.001 * distancefactor
                } else if (zoomL >=14 && zoomL < 16){
                    distance = 0.0003 * distancefactor
                } else if (zoomL >=16 && zoomL < 17){
                    distance = 0.00018 * distancefactor
                } else if (zoomL >=17 && zoomL < 18){
                    distance = 0.00008 * distancefactor
                } else if (zoomL >=18 && zoomL < 21){
                    distance = 0.00001 * distancefactor
                } else if (zoomL >=21 ){
                    distance = 0.000002 * distancefactor
                };	

                if ( mapKeys.indexOf(keyPressed) >= 0 ) {

                    // shift-i removes the map center graphic and keyboard instructions
                    if( keyPressed == "I" ){
                        mapCenterGraphic.removeAll();
                        myMap.view.ui.remove(userNoteInfo);
                        return;
                    }

                    // handle the map view's pan and select hotkeys
                    // the map's default keys are used, no modification required
                    if ( keyPressed === 'ArrowUp' ){
                        setCenter(lat + distance, lon)
                    } else if ( keyPressed === 'ArrowDown' ){
                        setCenter(lat - distance, lon)
                    } else if ( keyPressed === 'ArrowLeft' ){
                        setCenter(lat, lon - distance)
                    } else if ( keyPressed === 'ArrowRight' ){
                        setCenter(lat, lon + distance)
                    } else if ( keyPressed === 'Enter' || keyPressed === ' ' ){
                          
                        // if a popup component is passed in, use it.
                        if (myPopup){
                            //myPopup.location = myMap.view.center
                            //myPopup.fetchFeatures = true
                            //myPopup.defaultPopupTemplateEnabled = true
                            //myPopup.open = true

                            //myPopup.features = myMap.fetchPopupFeatures(myMap.view.center)
                            //console.log(myPopup.features)
                            //myPopup.open = myPopup.features ? true : false
                            openPopup ()

                        } else {
                            myMap.view.openPopup({
                                location: myMap.view.center,
                                fetchFeatures: true
                            })
                        }
                        

                        
                    } 
                }
            });

            // turn off keyboard tools if the mouse is used
            myMap.view.on("click", () => {
                mapCenterGraphic.removeAll();
                myMap.view.ui.remove(userNoteInfo);  
            });

            myMap.view.on("drag", () => {
                mapCenterGraphic.removeAll();
                myMap.view.ui.remove(userNoteInfo);
            });

            // handle the map's pan and zoom events. 
            // When the map stops moving, update the center graphic.
            // This works better than updating it after every arrow key event.

            reactiveUtils.watch(
                () => myMap.view.stationary,
                (response) => {
                    if(response === true){
                        if (mapCenterGraphic.graphics.length > 0){
                            addMapCenterGraphic();
                        }
                    }
                }
            );

            /*****************************************************************
            * functions for adding the map center graphic and panning the map
            *****************************************************************/

            function addMapCenterGraphic() {
                
                let center_latLng = myMap.view.center;
                let y = center_latLng.latitude;
                let x = center_latLng.longitude;
                let point = {
                    type: "point", 
                    x: x,
                    y: y
                };
                
                // clean up the graphics layer and add a new graphic at the maps new center
                mapCenterGraphic.removeAll();

                mapCenterGraphic.add(new Graphic({
                    geometry: point,
                    symbol: markerSym
                }));

                mapCenterGraphic.add(new Graphic({
                    geometry: point,
                    symbol: crossSym
                })); 
                  
            };

            function setCenter(lat, lon) {
                const point = new Point({
                    x: lon,
                    y: lat
                });
                myMap.view.goTo(point);
            }

            async function openPopup () {
                
                const screenPoint = myMap.toScreen(myMap.view.center)
                const generator = await myMap.fetchPopupFeatures(screenPoint, {pointerType:"touch"})
                const features = await Array.fromAsync(generator);

                myPopup.features = features
                myPopup.location = myMap.view.center

                if (features.length > 0){
                    myPopup.open = true
                } else {
                    myPopup.open = false
                }
            }

        })
    }
}
