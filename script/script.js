//Assignment 3
//Due Thursday March 26

var margin = {t:50,r:50,b:100,l:75},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;


//Set up SVG drawing elements -- already done
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//Scales
var scales = {};
    scales.x = d3.scale.log().range([0,width]);
    scales.y = d3.scale.linear().range([height,0]);


//Global variables
var yVariable = "CO2 emissions (kt)",
    y0 = 1990,
    y1 = 2000;


//d3.map for metadata
var metaDataMap = d3.map();
var colorScale = d3.scale.ordinal()
    .domain(['Europe & Central Asia','South Asia','Middle East & North Africa','North Americas','Sub-Saharan Africa','East Asia & Pacific','Latin America & Caribbean','undefined'])
    .range(['Crimson','LightGreen','CornflowerBlue','black','LightCoral','DarkCyan','orange','yellow','white']);

//TODO: create a layout function for a treemap
var treemap = d3.layout.treemap()
    .children(function(d){
        return d.values; // go from the top look for values to keep tracking children.
    })
    .value(function(d){
        return d.data.get(1990);
    }) //size of the nodes
    .size([width,height])//give the draw size
   //console.log(treemap(root));







//START!
queue()
    .defer(d3.csv, "data/00fe9052-8118-4003-b5c3-ce49dd36eac1_Data.csv",parse)
    .defer(d3.csv, "data/metadata.csv", parseMetaData)
    .await(dataLoaded);

function dataLoaded(err, rows, metadata){

    //First, combine "rows" and "metadata", so that each country is assigned to a region
    //console.log(rows) //in the console.log you can see that the information related to each city had been parsed annually
    rows.forEach(function(row){
        row.region1 = metaDataMap.get(row.key); // add the metadata 'region' information into rows, add information into object
    });// I have a question about the 'key' here!
    //console.log(rows)// you can see the undefined key
    //Then create hierarchy based on regions, using d3.nest()
    var nest = d3.nest()
        .key(function(d){
            return d.region1 ;
        });
    var nestedData = nest.entries(rows);
    console.log(nestedData);

    var root = {
        key:"regions",
        values: nestedData
    }; //give a higher 'tree level' to the regions...end with values no exist
    console.log(root);
    //Finally, perform a treemap layout on the data
    draw(root);
}

function draw(root){
    //Append <rect> element for each node in the treemap
var nodes = svg.selectAll('.node')
        .data( treemap(root),function(d){return d.key;})
        .classed('leaf',function(d){ //show the lead don't have children!!
        return !(d.children);
    });

    var nodesEnter =nodes
        .enter()
        .append('g')
        .attr('class','node')
        .attr('transform',function(d){
            return "translate("+d.x+','+d.y+')';
        })
        ;
    nodesEnter
        .append('rect')
        .attr('width',function(d){return d.dx;})//dx and dy are cuculate by defualt
        .attr('height',function(d){return d.dy;})
        .style('fill',function(d){
            var continent = metaDataMap.get(d.key);
            return colorScale(continent);
        })
        .style('stroke','black')
        .style('stroke-width','.5px')




    //Also append <text> label for each tree node that is a leaf

    nodesEnter
        .each(function(d){
            if(d.dx > 50 && d.dy >20){ //width enough to give the text
                var textlabel = d3.select(this)
                    .append('text');
                textlabel
                    .text(function(d){
                        return d.key;
                    })
                    .attr("font-family", "serif")
                    .attr('dx', d.dx/2)
                    .attr('dy', d.dy/2)
                    .attr('text-anchor','middle');
            }
        });
}

function parse(d){
    var newRow = {
        key: d["Country Name"],
        series: d["Series Name"],
        data:d3.map()
    };
    for(var i=1990; i<=2013; i++){
        var heading = i + " [YR" + i + "]";
        newRow.data.set(
            i,
            (d[heading]=="..")?0:+d[heading]
        );
    }

    return newRow;
}

function parseMetaData(d){
    var countryName = d["Table Name"];
    var region = d["Region"];
    metaDataMap.set(countryName, region);
}