 var map = L.map('map', {zoomControl: false, scrollWheelZoom: true}).setView([20.289373,-156.917480], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png').addTo(map);


    d3.json('assets/hawaii earthquakes.geojson').then(function(data) {

        var filter = crossfilter(data.features);

        var all = filter.groupAll();

        var everything = filter.dimension(function(d) {
            return d
        });

        var geomDimension = filter.dimension(function(d) {
            return d.geometry
        });

        var magDimension = filter.dimension(function(d) {

            var mag = d.properties.mag;
            magClass = "> 4";

            if (mag <=2.6) {
                magClass = "2.4-2.6";
            } else if ( mag > 2.6 && mag <= 2.9) {
                magClass = "2.7-3";
            } else if (mag > 2.9 && mag <= 3.2) {
                magClass = "3.1-3.3";
            } else if (mag > 3.2 && mag <= 3.5) {
                magClass = "3.4-3.6";
            } else if (mag > 3.5 && mag <= 3.8) {
                magClass = "3.7-3.9";
            } else {
                magClass = ">3.9";
            }
            return magClass;
        });

        var nstDimension = filter.dimension(function(d) {
            var nst = d.properties.nst;
            nstClass = ">75";

            if (nst <= 10) {
                nstClass = "10-25";
            } else if (nst > 25 && nst <= 40) {
                nstClass = "25-39";
            } else if (nst > 40 && nst <= 55) {
                nstClass = "40-54";
            } else if (nst > 55 && nst <= 70) {
                nstClass = "55-74";
            } else {
                nstClass = ">75";
            }
            return nstClass;
        });


        var dateDimension = filter.dimension(function(d) {

            return d3.timeDay(new Date(d.properties.time));
        });

        var magDimensionGroup = magDimension.group();

        var nstDimensionGroup = nstDimension.group();

        var dateDimensionGroup = dateDimension.group();

        var geoJsonLayer = L.geoJson({
            type: 'FeatureCollection',
            features: geomDimension.top(Infinity)
        }, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: Math.pow(feature.properties.mag, 2) / 2,
                    fillColor: "red",
                    color: "#fff",
                    weight: 1,
                    stroke: false,
                    opacity: 0.1,
                    fillOpacity: 0.1
                })
            },
            onEachFeature: function(feature, layer) {
                layer.bindTooltip(feature.properties.mag.toString());
            }
        }).addTo(map);

        var magChart = dc.barChart('#mag-chart');
        magChart
            .height(100)
            .margins({
                top: 10,
                right: 50,
                bottom: 30,
                left: 40
            })
            .dimension(magDimension)
            .group(magDimensionGroup)
            .elasticY(true)
            .x(d3.scaleOrdinal())
            .xUnits(dc.units.ordinal)
            .yAxis()
            .ticks(3);

        var nstChart = dc.barChart('#nst-chart');

        nstChart
            .height(100)
            .margins({
                top: 10,
                right: 50,
                bottom: 30,
                left: 40
            })
            .dimension(nstDimension)
            .group(nstDimensionGroup)
            .elasticY(true)
            .x(d3.scaleOrdinal())
            .xUnits(dc.units.ordinal)
            .yAxis()
            .ticks(3);


        var dateChart = dc.lineChart('#date-chart');
        dateChart
            .renderArea(true)
            .height(150)
            .transitionDuration(1000)
            .margins({
                top: 30,
                right: 50,
                bottom: 25,
                left: 40
            })
            .dimension(dateDimension)
            .group(dateDimensionGroup)
            .elasticY(true)
            .x(d3.scaleTime().domain([new Date(2018, 3, 19), new Date(2018, 4, 17)]))
            .xUnits(d3.timeDays);

        var earthquakeCount = dc.dataCount('.dc-data-count');
        earthquakeCount
            .dimension(filter)
            .group(all)
            .html({
                some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a>',
                all: 'All records selected. Please click on the graph or change the map view to apply filters.'
            });

        dc.renderAll();

        function updateCharts() {
            geomDimension.filter(function(d) {
                return map.getBounds().contains(L.geoJSON(d).getBounds())
            });
            dc.redrawAll();
        }

        function updateMap() {
            geoJsonLayer.clearLayers();
            geoJsonLayer.addData({
                type: 'FeatureCollection',
                features: everything.top(Infinity)
            });
        }

        map.on('zoomend moveend', function() {
            updateCharts();
        });

        magChart.on('filtered', function(chart, filter) {
            updateMap()
        });

        nstChart.on('filtered', function(chart, filter) {
            updateMap()
        });

        dateChart.on('filtered', function(chart, filter) {
            updateMap()
        });

    })


