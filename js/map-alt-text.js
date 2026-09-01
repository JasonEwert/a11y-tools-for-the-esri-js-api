class MapAltText{
    
    ////////////////////////////////////////////////////////////////////
    //                                                                //
    // Dynamic map descriptions! (alt text)                           //
    //                                                                //
    // Insert a div describing basemap layers using the map's extent  // 
    // and an Esri feature service.                                   //
    //                                                                //
    // Requirements:                                                  //
    // Esri JS API v4.23 - 5.1                                        //
	// Tested with: v5.1   (July 2026)                                //
    //                                                                //
    // myMap    - Required. The arcgis-map component.                 //
    // hideText - Optional. Hides the alt text div. boolean           //
    // For example, the following adds a new instance of this class.  //
    // new KeyboardAssistant( document.querySelector("arcgis-map") ); //
    //                                                                //
    // Developed by: MNIT in partnership with the Minnesota Pollution //
    // Control Agency. (Jason Ewert & jennifer Strahan)               //
    //                                                                //
    ////////////////////////////////////////////////////////////////////

    constructor(myMap, hideText){

        // mapView - The map element. Using the API's components: document.querySelector("arcgis-map");
		// hideText - if true, hides the alt text div

        ///////////////////////////
        // dynamic alt text      //
        ///////////////////////////

        require([
            "esri/core/reactiveUtils",
            "esri/layers/FeatureLayer"
        ], (
            reactiveUtils,
            FeatureLayer
        ) => {

            const mapView = myMap.view;

            ///////////////////////////////////////////////
            // customize options for the map description //
            ///////////////////////////////////////////////

            // limis the length of the map' salt text. Try a value between 100 and 300.
			const locStrLength = 200; 

            // set a custom feature service to query feature names at set scale ranges.
			const customFeatureLayer = new FeatureLayer({
                url: "https://pca-gis02.pca.state.mn.us/ArcGIS/rest/services/WIMN/sites/MapServer/1",
				//url: "https://pca-gis02.pca.state.mn.us/ArcGIS/rest/services/WIMN/wimn_tempo/MapServer/1",
            });
            const customFeatureLayerNameField = 'name'
            // A list of scale ranges wher ethis query runs. ["city","building"]
            let customQueryScale = ["building"] 


            ///////////////////////////////////////
            // create a div for the map text.    //
            ///////////////////////////////////////

            let mapDescription  = document.createElement("div");  			
            mapDescription.id = "mapDescription";
            mapDescription.setAttribute('aria-live', 'assertive');
            mapDescription.setAttribute('tabindex', '-1'); // if 0 this is read every time, if -1 only changes are read (desired functionality)
            mapDescription.style.width = "100%";
            mapDescription.style.padding = "2px",
            mapDescription.style.backgroundColor = "rgba(255, 255, 255, 0.8)"; // from the credits styles
            mapDescription.style.backgroundBlendMode;
            mapDescription.style.fontSize = "12px";       
            mapDescription.innerHTML = "A map of the world is loading, panning, and zooming into its default location."
			if (hideText === true){ 
				mapDescription.style.backgroundColor = "rgba(255, 255, 255, 0)"
				mapDescription.style.color = "rgba(255, 255, 255, 0)"				
			}
            mapView.ui.add(mapDescription, {position: "bottom-left"});

            // USA 2020 Census Population Characteristics - Place Geographies, Living Atlas, Esri, Authoritative
            // 3, NAME
            const incorpPlace = new FeatureLayer({
                url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population_Place/FeatureServer",
                layerId: 3
            });

            // USA Major Cities, Living Atlas, Esri, Authoritative
            // 0, NAME
            const city = new FeatureLayer({
                url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Major_Cities_/FeatureServer",
                layerId: 0
            });

            // USA Counties Generalized Boundaries, Living Atlas, Esri, Authoritative
            // 0, NAME, STATE_NAME
            const county = new FeatureLayer({
                url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized_Boundaries/FeatureServer",
                layerId: 0
            });

            ////////////////////////////////////////////////
            // Watch for view changes and update the div. //
            ////////////////////////////////////////////////
            
            reactiveUtils.watch(
                () => [mapView.stationary, mapView.zoom],
                function ([stationary, zoom]){
                    // Only run the query when the view is stationary
                    if(stationary){         
                        executeQueries();
                    }
                }
            );

            async function executeStateQuery(){
                let query = county.createQuery()
                query.geometry = mapView.center
                query.distance = 50
                query.units = "miles"
                query.returnGeometry = false
                query.outFields = ["STATE_NAME"]
                let response = await county.queryFeatures(query)
                return(response.features)
            };

            async function executeCountyQuery(){
                let query = county.createQuery()
                query.geometry = mapView.center
                query.distance = 10
                query.units = "miles"
                query.returnGeometry = false
                query.outFields = ["NAME"]
                let response = await county.queryFeatures(query)
                return(response.features)
            };

            async function executeBigCityQuery(){
                let query = city.createQuery();
                query.geometry = mapView.extent 
                query.returnGeometry = false;
                query.outFields = ["NAME"];          
                let response = await city.queryFeatures(query);
                return(response.features)
            };

            async function executeCityQuery(){
                let query = incorpPlace.createQuery();
                query.geometry = mapView.extent
                query.returnGeometry = false;
                query.outFields = ["NAME"];
                let response = await incorpPlace.queryFeatures(query);
                return(response.features)
            };
			
			async function executeCustomQuery(){
                let query = customFeatureLayer.createQuery();
                query.geometry = mapView.extent
                query.returnGeometry = false;
                query.outFields = ["name"];
                let response = await customFeatureLayer.queryFeatures(query);
                return(response.features)
            };

            async function executeQueries() {
                
                let zoomL = mapView.zoom
                let scale
                const smScale = [ "world", "country", "state" ]
                const medScale = [ "county" ] // will also query "big cities" at some scales
                const lgScale = [ "township", "city" ] // I'm not sure we need a "large city" query, this data is better with the coutnies
                
                let locStr = ""

                if(zoomL < 5){
                    scale = "world"
                } else if (zoomL >=5 && zoomL < 6){
                    scale = "country"
                }else if (zoomL >=6 && zoomL < 9){
                    scale = "state"
                }else if (zoomL >=9 && zoomL < 12){
                    scale = "county"
                }else if (zoomL >=12 && zoomL < 14){
                    scale = "township"
                }else if (zoomL >=14 && zoomL < 18){
                    scale = "city"
                }else if (zoomL >=18 ){
                    scale = "building"
                }

                if (smScale.includes(scale) ){
                    
                    let states = await executeStateQuery()
                    states.map(function (result) {

                        let name = result.attributes.STATE_NAME
                        if ( locStr.includes(name) == false){
                            locStr = locStr +  name + ", "
                        }
                    })
                
                } else if (medScale.includes(scale) ){

                    let counties = await executeCountyQuery()
                    counties.map(function (result) {
                        let name = result.attributes.NAME
                        if ( locStr.includes(name) == false){
                            locStr = locStr +  name + ", "
                        };
                    });

                    if (zoomL >=10){
                        let cities = await executeBigCityQuery() 
                        cities.map(function (result) {
                            let name = result.attributes.NAME
                            if (name.slice(-4) === "city") {
                                name = name.substring(0, name.length -5)
                            }
                            if ( locStr.includes(name) == false && locStr.length < locStrLength ){
                                locStr = locStr +  name + ", "
                            }
                        })
                    }

                } else if (lgScale.includes(scale) ){
                    
                    let cities = await executeCityQuery() 
                    cities.map(function (result) {
                        let name = result.attributes.NAME
						if (name.slice(-4) === "city") {
                            name = name.substring(0, name.length -5)
                        }
                        if ( locStr.includes(name) == false && locStr.length < locStrLength ){
                            locStr = locStr +  name + ", "
                        }
                    })

                } else if (customQueryScale && customQueryScale.includes(scale)) {

					let features = await executeCustomQuery()
					features.map(function (result) {
		
                        let featurename = result.attributes[customFeatureLayerNameField]
                        if ( locStr.includes(featurename) == false && locStr.length < locStrLength ){
                            locStr = locStr +  featurename + ", "
                        }
                        
					})

                } else {

                    locStr = " map features were not queried. Please zoom to a different scale  "
                }
                
                ;

                updateAltText(locStr, zoomL, scale)         

            };

            function updateAltText(locList, zoomL, scale) {
                 
                let divStrScale = `is set to a ${scale} scale.`
                let list
                if (locList.length === 0){
                    list = " no map features found at this location"
                } else {
                   list = locList.substr(0, locList.length -2) // removes the trailing ', ' :)
                }
                

                if (zoomL <= 5) {
                    mapDescription.innerHTML = `This map ${divStrScale} Zoom in to query states, counties, and cities.`;
                } else {
                    mapDescription.innerHTML = `The map ${divStrScale} It contains ${list}.`     
                }

            };
			
			// handle the map view's hot key shortcuts: arrows, -, +, and =
			
			const mapKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown","-", "=", "+"];
						
			myMap.view.on("key-up", (event) => {

                const keyPressed = event.key;
				
                if ( mapKeys.indexOf(keyPressed) >= 0 ) {


                    //if the key is an arrow
                    if (keyPressed === "ArrowLeft"){
                        mapDescription.innerHTML=`Panning west.`;						
                    } else if (keyPressed === "ArrowUp"){					
                        mapDescription.innerHTML=`Panning north.`;		
                    } else if (keyPressed === "ArrowRight"){							
                        mapDescription.innerHTML=`Panning east.`;										
                    } else if (keyPressed === "ArrowDown"){							
                        mapDescription.innerHTML=`Panning south.`;		
                    } else if (keyPressed === "="){							
                        mapDescription.innerHTML=`Zooming in.`;		
                    } else if (keyPressed === "+"){							
                        mapDescription.innerHTML=`Zooming in.`;		
                    } else if (keyPressed === "-"){							
                        mapDescription.innerHTML=`Zooming out.`;		
                    };						
                }

            });

        })
    }
}