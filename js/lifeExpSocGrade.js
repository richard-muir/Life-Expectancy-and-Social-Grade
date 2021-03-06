// GLOBALS
// This should be global
let mapData = [],
    vbWidth = 1300,
    vbHeight = 50,
    scatterWidth = 500,
    scatterHeight = 500,
    scatterMargin = {
        t : 50,
        b : 30,
        l : 30,
        r : 0
    },
    scatterMoveX = 650,
    scatterMoveY = 50,
    legendMoveX = 650,
    legendMoveY = 600;

// These colours map to a 3x3 grid of terciles for each of the two data items, life expectancy & social grade
let colourMapping = [['#574249', '#627f8c', '#64acbe'],
                    ['#985356', '#ad9ea5', '#b0d5df'],
                    ['#c85a5a', '#e4acac', '#e8e8e8']]

// Will use these values to create the boxes behind the scatterplot
let FemLifeExpTerciles = {
    3 : 79.5,
    2 : 82.7,
    1 : 83.8,
    0 : 86.6
},
    SocialGradeABTerciles = {
        0 : 0,
        1 : 0.1836532540132367,
        2 : 0.25183186623084475,
        3 : 0.48119795003203075
    }

// Will use this to create the four lines which divide the scatterplot into terciles for each variable
let scatterLines = [
    {
        expStart : 83.8,
        expEnd : 83.8,
        ABStart : 0,
        ABEnd : 0.48119795003203075
    },
    {
        expStart : 82.7,
        expEnd : 82.7,
        ABStart : 0,
        ABEnd : 0.48119795003203075
    },
    {
        expStart : 0,
        expEnd : 100,
        ABStart : 0.1836532540132367,
        ABEnd : 0.1836532540132367
    },
    {
        expStart : 0,
        expEnd : 100,
        ABStart : 0.25183186623084475,
        ABEnd : 0.25183186623084475
    }
];

// Changing these let us change the variables which are represented on the map
 // Might want to allow user to switch later on
let state2 = 'F-AB',
    yData = 'Female Life Expectancy 2010-2012',
    xData = 'Approximated social grade AB';

let svg = d3.select("#mapCont").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "svg")
    .style("border", "1px solid black")
    .attr("viewBox", `-100 0 ${vbWidth} ${vbHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
let svg1 = svg.append("g")
    .attr("id", "map");

let initialDescriptionText = "Click on a region on the map or a point on the scatterplot to find out more about the life expectancy and social grade in that region"
let startingText = 'Select a point on the map or scatterplot to see its counterpart on the other graphic. Alternatively select one of the boxes to the left to view more information about that category';
let legendExplanation = {
    1 : {
        1 : 'People in these regions tend to live shorter lives than most people in the UK. These regions also have the lowest percentage of people in social grades A & B.',
        2 : 'People in these regions tend to live shorter lives than most people in the UK. The number of people in social grades A & B is comparable with the UK average.',
        3 : 'People in these regions tend to live shorter lives than most people in the UK. These regions also have the highest percentage of people in social grades A & B',
    },
    2 : {
        1 : 'The life expectancy for people in these regions is comparable to the UK average. These regions also have the lowest percentage of people in social grades A & B.',
        2 : 'The life expectancy for people in these regions is comparable to the UK average. The number of people in social grades A & B is comparable with the UK average.',
        3 : 'The life expectancy for people in these regions is comparable to the UK average. These regions also have the highest percentage of people in social grades A & B',
    },
    3 : {
        1 : 'People in these regions tend to live longer lives than most people in the UK. These regions also have the lowest percentage of people in social grades A & B.',
        2 : 'People in these regions tend to live longer lives than most people in the UK. The number of people in social grades A & B is comparable with the UK average.',
        3 : 'People in these regions tend to live longer lives than most people in the UK. These regions also have the highest percentage of people in social grades A & B',
    },
}

// HELPER FUNCTIONS
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 1,
        lineHeight = 1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy"));
        if (isNaN(dy)){
            dy = 0.32;
        };
    var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", +lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

function titleCase (sentence) {
    return sentence.split(' ').map(
        function (s) {
            return s[0].toUpperCase() + s.substring(1).toLowerCase()      
        }).join(' ') ;
}

function resetMap(){
    // Set all of the map colours & lines back to their original
    let mapPoints = d3.selectAll('.subunit')
        .style('fill', function(d){return d.color;})
        .style("stroke", '#333')
        .style("stroke-width", 0.5);
    svg.select('#linking-line').remove()
    return mapPoints;
}

function resetScatter(){
    let scatterPoints = d3.selectAll('.dot')
        .style('fill', function(d){return d.color;})
        .attr("r", 3.5)
        .style("stroke", '#333')
        .style('stroke-width', 1);
    return scatterPoints;
}

function resetLegend(){
    d3.select('#text-rect')
        .style('fill', '#fff')
    d3.select('#legend-text')
        .style('font-family', 'Droid Sans')
        .text(startingText)
        .call(wrap, 340);
    d3.select('#DataDescription')
        .text(initialDescriptionText)
        .call(wrap, 340)
}

function reset(){
    resetMap();
    resetScatter();
    resetLegend();
}

function legendSelection(){
    let exp = Number(this.id.substring(3, 4)) + 1, // Strip out the terciles
        soc = Number(this.id.substring(8, 9)) + 1;
    let text = legendExplanation[exp][soc]; // Use them to get the explanation
    let t = d3.select('#legend-text') // Populate the text-box with the explanation
        .style('font-family', 'Droid Sans')
        .text(text)
        .call(wrap, 350);

    let newColour = this.getAttribute('fill'); // Fill the text box with a slightly transparents version of the colour
    d3.select('#text-rect')
        .style('fill', newColour)
        .attr('opacity', 0.8);
    
    // Reset the map, then colour all the areas grey
    let mapPoints = resetMap()
        .style('fill', '#d0d0d0')
    // Now colour the selected points the correct colour
    mapPoints.filter(function(d){return d.color === newColour;})
        .style('fill', newColour)
        .style("stroke", '#000')
        .style("stroke-width", 1.5)

    // Repeat process for scatter points
    let scatterPoints = resetScatter();
    scatterPoints.filter(function(d){return d.color === newColour;})
        .attr("r", 5)
        .style("stroke", '#000')
        .style("stroke-width", 1.5)
}

// This is used to draw a line from the centre of the region to the centre of the scatterpoint
function getBoundingBoxCenter (selection) {
    var element = selection.node();
  // use the native SVG interface to get the bounding box
  var bbox = element.getBBox();
  // return the center of the bounding box
  return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
}

function connectElements(d, src, dest, srcTranslate, destTranslate){
    updateDescription(d, src);

    let resetFuncLookup = {
            ".dot" : resetScatter,
            ".subunit" : resetMap,
        };
    // Return the source selection to their original colour
    let sourceSelection = resetFuncLookup[src]()
    // Return the destination selection to their original colour
    let destinationSelection = resetFuncLookup[dest]()
    //Delete the original line
    svg.select('#linking-line').remove()

    // Select the destination point which matches the source point
    let destinationPoint = destinationSelection.filter(function(s){
        return s.id === d.id;
    });
    let sourcePoint = sourceSelection.filter(function(s){
        return s.id === d.id;
    })

    // Colour the source and destination points in red
    sourcePoint.style('fill', 'red').attr("r", 5)
                        .style("stroke", '#000')
                        .style("stroke-width", 1.5)
    destinationPoint.style('fill', 'red').attr("r", 5)
                        .style("stroke", '#000')
                        .style("stroke-width", 1.5)
    // Get the centroid of each element
    let sourceCentroid = getBoundingBoxCenter(sourcePoint);
    let destCentroid = getBoundingBoxCenter(destinationPoint);

    // Connect them, remembering translations ([0,0] for map, [xx, yy] for scatter)
    svg.append("line")
        .attr('x1', sourceCentroid[0] + srcTranslate[0])
        .attr('y1', sourceCentroid[1] + srcTranslate[1])

        .attr('x2', destCentroid[0] + destTranslate[0])
        .attr('y2', destCentroid[1] + destTranslate[1])
        .style("stroke", 'red')
        .style("stroke-width", 1.5)
        .attr('id', 'linking-line')
}

// LOAD THE DATA & CREATE ELEMENTS
queue()
    .defer(d3.json, "data/lifeExp/uk.json") // UK Country shapefile
    .defer(d3.json, "data/lifeExp/topo_ladall.json") // UK Region shapefile
    .defer(d3.json, "data/lifeExp/LifeExpAndSocialGrade.json")
    .await(function(error, ukCountries, ukRegions, socialGrade){
        mapData = socialGrade;
        makeCountryMap(ukCountries);
        makeRegionMap(ukRegions);
        createScatter(mapData);
        createLegend();
        createDescription();
    });

// Make the map projection & path
let projection = d3.geoAlbers()
    .center([7.0, 53.5])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(6000),
    path = d3.geoPath().projection(projection);

function makeCountryMap(countryData) {
    // Draw the countries Ireland, NIreland & Scotland in grey
    svg1.selectAll(".country")
        .data(topojson.feature(countryData, countryData.objects.subunits).features.filter(function(d) {
            return d.id === 'IRL' || d.id === 'NIR' || d.id === 'SCT';
        }))
        .enter().append("path")
        .attr("class", function(d) {return "country " + d.id;})
        .attr("d", path);
}

function combineRegions(id, name, set, regionData){
    // Filter all the regions to just the two we want, then combine
    let region = topojson.merge(regionData, regionData.objects.lad.geometries.filter(function(d) {
        return set.has(d.id);
    }));
    // Set the ID & properties of the new region
    region.id = id;
    region.properties = {
        'LAD13NM' : name
    }
    // Add it to the map
    svg1.append("path")
        .datum(region)
        .attr("class", "subunit E")
        .attr("id", region.id)
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.75);
    }

function updateMap() {
    // Adds all the interation & fills
    svg1.selectAll(".subunit")
        .style("fill", function(d) {
            let dataLine = mapData.filter(function(e) {return e.LAD13CD === d.id;})[0]
            d.color = dataLine[`${state2}_Color`]; // Store the colour as a property for later
            return d.color;
        })
        .on("mouseover", function(d) {
            d3.select(this).style("stroke", '#000').style("stroke-width", 2)})
        .on("mouseout", function(d) {
            d3.select(this).style("stroke", '#333').style("stroke-width", 0.75)})
        .on("click", function(d){connectElements(d, '.subunit', '.dot',[0,0], [scatterMoveX, scatterMoveY]);});
}

function makeRegionMap(regionData) {
    let hackney = d3.set(['E09000001', 'E09000012']);
    // Draws the regions
    svg1.selectAll(".subunit")
        .data(topojson.feature(regionData, regionData.objects.lad).features.filter(function(d) {
            // Hackney & the isles of scilly are being annoying, need to exclude scilly altogether
            // and combine hackney & city of london together to draw later. Also no scotland.
            return d.id != 'E06000053' && !hackney.has(d.id) && d.id.substring(0, 1) !== 'S';
        }))
        .enter().append("path")
        .attr("class", function(d) {return `subunit ${d.id[0]} ${d.id.slice(0, 3)}`;})
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.75);
    // Draw the combined hackney & city of london bit
    combineRegions('E09000001', 'Hackney and City of London', hackney, regionData);
    updateMap();
}

function createLegend() {
    let legendWidth = 100,
        legendHeight = 100;

    // G element to hold everything
    let textG = svg.append("g")
        .attr("transform", `translate(${legendMoveX + 120},${legendMoveY - 50})`)
        .attr("id", "textG");

    // Rect to fill with colour to better highlight what has been selected
    textG.append('rect')
        .attr('height', 120)
        .attr('width', scatterWidth - 20)
        .style('fill', 'none')
        .style('stroke', 'black')
        .attr('transform', `translate(-130, -30)`)
        .attr('id', 'text-rect');

    // Pre-fill the text here, but this will change
    textG.append('text')
        .attr("width", scatterWidth - legendWidth)
        .attr("height", legendHeight)
        .attr("id", "legend-text")
        .text(startingText)
        .style('font-family', 'Droid Sans')
        .call(wrap, 340);
    // G to hold the squares
    key = textG.append("g")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("id", "legend")
        .attr("transform", `translate(${-120},${50})`);

    // Can use for x & y because it's a square
    let legendScale = d3.scaleBand()
        .domain([0, 1, 2])
        .range([0, 100])
        .paddingInner(0.1);

    // Add the 9 boxes of the legend
    for (let row in colourMapping){
        for (let col in colourMapping[row]){
            let box = key.append("rect")
                .attr("class", "legend-box")
                .attr("width", legendScale.bandwidth())
                .attr("height", legendScale.bandwidth())
                .attr("transform", `translate(${legendScale(col)},${-legendScale(row)})`)
                .attr("fill", colourMapping[row][col])
                .attr("id", `Exp${row} Soc${col}`) 
                .attr('class', colourMapping[row][col])
                .on('click', legendSelection);
            }
        }
    // Make the reset button. Tried doing this as HTML, but didn't feel like it was part of the viz
    textG.append("text")
            .text("Reset")
            .style('font-family', 'Droid Sans')
            .attr("transform", `translate(${282}, ${110})`);
    let resetButton = textG.append('rect')
        .attr("transform", `translate(${250}, ${95})`)
        .attr("height", 19)
        .attr("width", 100)
        .attr("rx", 2)
        .attr("ry", 2)
        .style("fill-opacity", 0)
        .style("stroke", "black")
        .attr('id', 'resetButton')
        .on('click', reset);
    }

function createDescription(){
    // Sets up the text object near the map which provides a description of each region
    let descCont = svg.append("g")
        .attr('transform', `translate(${ 260 },${ 30 })`);
    descCont.append("text")
        .attr('id', 'DataDescription')
        .text(initialDescriptionText)
        .style('font-family', 'Droid Sans')
        .call(wrap, 340);
}


function updateDescription(data, src){
    // If the person clicked on the scatter, we can use the data there
    let dataPoint;
    if (src === '.dot'){
        dataPoint = data;
    }
    // Otherwise we need to use the mapdata to filter the scatter points
    else{
        dataPoint = d3.selectAll('.dot').filter(function(e){return e.LAD13CD === data.id}).data()[0]
    }
    // Get the different attributes to put into the text
    let id = dataPoint.id,
        name = titleCase(dataPoint.LAD13NM),
        lifeExpectancyF = dataPoint['Female Life Expectancy 2010-2012'],
        lifeExpectancyM = dataPoint['Male Life Expectancy 2010-2012'],
        socGradeAB = dataPoint['Approximated social grade AB'],
        maleTercile = dataPoint.MaleLifeExp,
        femaleTercile = dataPoint.FemaleLifeExp, 
        socGradeTercile = dataPoint.SocialGradeAB;
    // Turn the tercile numbers into something meaningful
    let lookup = {
        0 : 'lower than the UK average',
        1 : 'about the same as the rest of the UK',
        2 : 'higher than the UK average'
    }
    // Update the text
    let replacementText = `In ${name} women can expect to live, on average, ${lifeExpectancyF} years, and men ${lifeExpectancyM}. ${(socGradeAB*100).toFixed(1)}% of people here are in Social Grades A & B which is ${lookup[socGradeTercile]}`
    d3.select('#DataDescription')
        .text(replacementText)
        .call(wrap, 340)
}

function createScatter(data){
    // Scatter G
    let scatter = svg.append("g")
        .attr("id", "scatter")
        .attr("transform", `translate(${scatterMoveX}, ${scatterMoveY})`)
        .attr("width", scatterWidth)
        .attr("height", scatterHeight);
        
    // Scales & axes
    let xScale = d3.scaleLinear()
        .range([0,  scatterWidth - scatterMargin.l - scatterMargin.r])
        .domain([0, d3.max(data, function(d) {return d[xData]})])  // Might want to change these
        .clamp(true); 
    let yScale = d3.scaleLinear()
        .range([scatterHeight - scatterMargin.t - scatterMargin.b, 0])
        .domain(d3.extent(data, function(d) {return d[yData]}))
        .clamp(true);
    let xAxis = scatter.append("g")
        .attr("transform", `translate(${0}, ${scatterHeight - scatterMargin.t - scatterMargin.b})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format(".0%")));
    //xaxis title
    scatter.append('text')
        .attr('transform', `translate(${scatterWidth /2},${scatterHeight - scatterMargin.t - scatterMargin.b + 30})`)
        .style('text-anchor', 'middle')
        .text("Percentage of people in social grades A & B")
        .style('font-family', 'Droid Sans')
        .style('font-size', '0.75em')
    let yAxis = scatter.append("g")
        .attr("transform", `translate(${0}, ${0})`)
        .call(d3.axisLeft(yScale));
    //yaxis title
    scatter.append('text')
        .attr('transform', `rotate(-90) translate(${-(scatterHeight - scatterMargin.t - scatterMargin.b)/2},${-30})`)
        .style('text-anchor', 'middle')
        .text("Female life expectancy")
        .style('font-family', 'Droid Sans')
        .style('font-size', '0.75em')

    // Add the lines which delineate the different terciles
    scatterLines.forEach(function(line){
        scatter.append("line")
            .attr('x1', xScale(line.ABStart))
            .attr('x2', xScale(line.ABEnd))
            .attr('y1', yScale(line.expStart))
            .attr('y2', yScale(line.expEnd))
            .style("stroke", '#333')
            .style("stroke-width", 1.5)
    });
    // Have to reverse the terciles because svg plots from top-left
    let mapping = {
        0 : 2,
        1 : 1,
        2 : 0,
    }
    let arrayOf3 = [0,1,2];
    // Loop through the number of terciles, adding a rect for each
    for (soc in arrayOf3){
        for (exp in arrayOf3){
            soc = arrayOf3[soc];
            exp = arrayOf3[exp];
            scatter.append('rect')
                .attr('x', xScale(SocialGradeABTerciles[soc]))
                .attr('y', yScale(FemLifeExpTerciles[exp]))
                .attr('width', xScale(SocialGradeABTerciles[soc + 1]) - xScale(SocialGradeABTerciles[soc]))
                .attr('height', yScale(FemLifeExpTerciles[exp + 1])-yScale(FemLifeExpTerciles[exp]))
                .style('fill', colourMapping[mapping[exp]][soc])
                .style('opacity', 0.1)
                .attr('class', `Exp: ${exp}, Soc: ${soc}`)
        }
    }
    let points = scatter.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("id" , function (d){
            d.id = d.LAD13CD;
            return `map_${d.LAD13CD}`;
        })
        .attr("r", 3.5)
        .style("fill", function(d) {
            d.color = d[`${state2}_Color`];
            return d.color;
        })
        .style("stroke", '#333')
        .style('stroke-width', 1)
        .attr("cx", function(d){
            return xScale(d['Approximated social grade AB']);
        })
        .attr("cy", function(d){
            return yScale(d['Female Life Expectancy 2010-2012']);
        })
        .on("click",  function(d){connectElements(d, '.dot', '.subunit', [scatterMoveX, scatterMoveY], [0,0]);});
}

