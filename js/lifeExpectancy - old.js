let mapData = [],
    smallRegionalData = [];



let GORNameLookup = {
    "E12000001": "North East",
    "E12000002": "North West",
    "E12000003": "Yorkshire and The Humber",
    "E12000004": "East Midlands",
    "E12000005": "West Midlands",
    "E12000006": "East of England",
    "E12000007": "London",
    "E12000008": "South East",
    "E12000009": "South West"
};





var stateVarLookup = {
    'male': {
        'comparisonCountry': 'MLExp Country',
        'comparisonCountryRate': 'MLExp CountryRate',
        'VOI': 'Male Life Expectancy 2010-2012',
        'title': "Life expectancy for males",
        minimumColor: "rgb(37,80,38)",
        maximumColor: "rgb(150,233,124)",
        hoverColor: '#C9FFAF',
    },
    'female': {
        'comparisonCountry': 'FLExp Country',
        'comparisonCountryRate': 'FLExp CountryRate',
        'VOI': 'Female Life Expectancy 2010-2012',
        'title': "Life expectancy for females",
        minimumColor: "rgb(110,76,168)",
        maximumColor: "rgb(211,143,253)",
        hoverColor: '#FFC2FF',

    },
};

let dataState = 'male';

let radios = document.getElementsByName('gender')



for (var i = 0, max = radios.length; i < max; i++) {
    radios[i].onclick = function() {
        dataState = this.value;
        updateText(dataState);
        updateMap(dataState);
        //updateLegend(dataState);
        switchMaleFemale();
    }
}

d3.select(window).on("resize", sizeChange);
d3.select(window).on("load", sizeChange);

function sizeChange() {
    d3.select("#map").attr("transform", "translate(0, 350) scale(" + parseFloat(d3.select("#mapCont").style("width")) / 900 + ")");
    d3.select("#map").style("height", (d3.select("#mapCont").style("width") * 0.618));
}


var height = 900;
var kwidth = 300,
    kheight = 140;



var svg1 = d3.select("#mapCont").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("class", "fullPageHeight")
    .append("g")
    .attr("id", "map");

var key = null,
    legend = null,
    legendMin = null,
    legendMax = null,
    y = null,
    yAxis = null,
    legendScale = null,
    legendText = null;

function createLegend() {
    // redo this

    key = svg1.append("g")
        .attr("width", kwidth)
        .attr("height", kheight)
        .attr("transform", "translate(500,-500)");

    legend = key.append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");


    legendMin = legend.append("stop").attr("offset", "0%")
        .attr("stop-opacity", 1);

    legendMax = legend.append("stop").attr("offset", "100%")
        .attr("stop-opacity", 1);

    key.append("rect")
        .attr("width", kwidth - 100)
        .attr("height", kheight - 100)
        .style("fill", "url(#gradient)")
        .attr("transform", "translate(100,10)");

    y = d3.scale.linear()
        .range([kwidth - 100, 0]);

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("bottom");

    legendScale = key.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(100," + (kheight - 90) + ")")
        .call(yAxis);;

    legendText = key.append("text")
        .attr("y", -10)
        .attr("x", 100)
        .attr("dy", ".71em")
        .style("text-anchor", "left");
}

function updateLegend(state) {

    if (state === 'child') {
        textSuffix = " (Deaths/1000 live births)";
    } else {
        textSuffix = " (Years)";
    }

    let minimum = stateVarLookup[state]['minimum'],
        maximum = stateVarLookup[state]['maximum'],
        minimumColor = stateVarLookup[state]['minimumColor'],
        maximumColor = stateVarLookup[state]['maximumColor'],
        hoverColor = stateVarLookup[state]['hoverColor'],
        VOI = stateVarLookup[state]['VOI'];

    legendMin.attr("stop-color", minimumColor);
    legendMax.attr("stop-color", maximumColor);

    y.domain([maximum, minimum]);
    yAxis.scale(y)
        .tickValues(y.domain());

    legendScale.call(yAxis);

    legendText.text(stateVarLookup[state]['title'] + textSuffix);

};






var projection = d3.geo.albers()
    .center([2.5, 52.0])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(11000)
    //.translate([width / 2, height / 2])
;

var cornwall = d3.set(['E06000052', 'E06000053']),
    hackney = d3.set(['E09000001', 'E09000012']);

var path = d3.geo.path().projection(projection);



queue()
    .defer(d3.json, "data/lifeExp/uk.json")
    .defer(d3.json, "data/lifeExp/topo_ladall.json")
    .defer(d3.json, "data/lifeExp/headlineData.json")
    .defer(d3.json, "data/lifeExp/LADMFLifeExp.json")
    .defer(d3.json, "data/lifeExp/LifeExpAndSocialGrade.json")
    .await(coalesceData);

function coalesceData(error, ukCountries, ukRegions, headLineData, smallregions, socialGrade) {

    console.log(socialGrade);

    //mapData = headLineData;
    mapData = socialGrade;
    smallRegionalData = smallregions;

    //gets the maximum values for use in the colour scale
    for (var i in stateVarLookup) {
        stateVarLookup[i]['minimum'] = d3.min(mapData, function(d) {
            let VOI = stateVarLookup[i]['VOI'];
            return d[VOI];
        });
        stateVarLookup[i]['maximum'] = d3.max(mapData, function(d) {
            let VOI = stateVarLookup[i]['VOI'];
            return d[VOI];
        });
    }

    //createLegend();
    makeCountryMap(ukCountries);
    makeRegionMap(ukRegions);
    sizeChange();
    



}


function makeCountryMap(countryData) {
    svg1.selectAll(".subunit")
        .data(topojson.feature(countryData, countryData.objects.subunits).features.filter(function(d) {
            return d.id === 'IRL' || d.id === 'NIR' || d.id === 'SCT';
        }))
        .enter().append("path")
        .attr("class", function(d) {
            return "subunit " + d.id;
        })
        .attr("d", path);

}


function makeRegionMap(regionData) {
    svg1.selectAll(".subunit")
        .data(topojson.feature(regionData, regionData.objects.lad).features.filter(function(d) {
            return !cornwall.has(d.id) && !hackney.has(d.id) && d.id.substring(0, 1) !== 'S';
        }))
        .enter().append("path")
        .attr("class", function(d) {
            return `subunit ${d.id[0]} ${d.id.slice(0, 3)}`;
        })
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.75);

    var cornwallScilly = topojson.merge(regionData, regionData.objects.lad.geometries.filter(function(d) {
        return cornwall.has(d.id);
    }))
    cornwallScilly.id = 'E06000052';
    cornwallScilly.properties = {
        'LAD13NM': 'Cornwall and Isles of Scilly'
    };

    var hackneyLondon = topojson.merge(regionData, regionData.objects.lad.geometries.filter(function(d) {
        return hackney.has(d.id);
    }))
    hackneyLondon.id = 'E09000001';
    hackneyLondon.properties = {
        'LAD13NM': 'Hackney and City of London'
    };


    svg1.append("path")
        .datum(cornwallScilly)
        .attr("class", "subunit E")
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.75);
    svg1.append("path")
        .datum(hackneyLondon)
        .attr("class", "subunit E")
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.75);

    updateMap(dataState);
    //updateLegend(dataState);

}



function updateMap(state) {
    let minimum = stateVarLookup[state]['minimum'],
        maximum = stateVarLookup[state]['maximum'],
        hoverColor = stateVarLookup[state]['hoverColor'],
        VOI = stateVarLookup[state]['VOI'];


    let state2 = 'F-AB';



    svg1.selectAll(".subunit.E")
        .style("fill", function(d) {
            let dataLine = mapData.filter(function(e) {return e.LAD13CD === d.id;})[0]
            console.log(dataLine);
            return dataLine[state2];
        });
    svg1.selectAll(".subunit.W")
        .style("fill", function(d) {
            let dataLine = mapData.filter(function(e) {return e.LAD13CD === d.id;})[0]
            return dataLine[state2];
        });



    d3.selectAll(".subunit.E").on({
        "mouseover": function(d) {
            let compRec = (mapData.filter(function(e) {
                return e['LAD13CD'] === d.id;
            })[0]);
            d3.select("#place").html(d.properties.LAD13NM);
            d3.select("#comparison").html(compRec[stateVarLookup[state]['comparisonCountry']]);
            d3.select('#VOI').html(compRec[stateVarLookup[state]['VOI']].toFixed(1));
            d3.select('#compVOI').html(compRec[stateVarLookup[state]['comparisonCountryRate']].toFixed(1));
            d3.select(this).style("fill", hoverColor);

        },
        "mouseout": function(d) {
            let colour = color(mapData.filter(function(e) {
                return e.LAD13CD === d.id;
            })[0][VOI]);
            d3.select(this).style("fill", colour);
        },
        "click": function(d) {
            LADData = smallRegionalData.filter(function(e) {
                return e['Area code'] === d.id & e['sex'] === dataState;
            })[0];
        }
    });

    d3.selectAll(".subunit.W").on({
        "mouseover": function(d) {
            let compRec = (mapData.filter(function(e) {
                return e['LAD13CD'] === d.id;
            })[0]);
            d3.select("#place").html(d.properties.LAD13NM);
            d3.select("#comparison").html(compRec[stateVarLookup[state]['comparisonCountry']]);
            d3.select('#VOI').html(compRec[stateVarLookup[state]['VOI']].toFixed(1));
            d3.select('#compVOI').html(compRec[stateVarLookup[state]['comparisonCountryRate']].toFixed(1));
            d3.select(this).style("fill", hoverColor);
        },
        "mouseout": function(d) {
            let colour = color(mapData.filter(function(e) {
                return e.LAD13CD === d.id;
            })[0][VOI]);
            d3.select(this).style("fill", colour);
        },
        "click": function(d) {
            LADData = smallRegionalData.filter(function(e) {
                return e['Area code'] === d.id & e['sex'] === dataState;
            })[0];
        }
    });

    var legend = d3.select('#gradient');


}

function isInteger(x) {
    return x % 1 === 0;
}


const compareArrays = (a1, a2) => {
    return (a1.length == a2.length) && a1.every(function(element, index) {
        return element === a2[index];
    });
};

const getXAndYVals = (dataIn) => {
    let xValues = [],
        yValues = [];
    for (let k in Object.keys(dataIn)) {
        key = Object.keys(dataIn)[k]
        if (isInteger(key.slice(0, 4))) {
            xValues.push(key);
            yValues.push(dataIn[key]);
        }
    }
    return [xValues, yValues];
};

const splitAndCapitalise = (str) => {
    str = str.replace(" UA", "");
    str = str.split("/")[0];
    str = str.toLowerCase();
    str = str.split(" ")
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(" ");

}
