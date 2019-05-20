function init_linechart(minrally,maxrally){
    d3.json("../statistics/rally_count.json",function(error,data){
        if (error)
            throw error;

        // init minrally and maxrally if are undefined,null,0,NaN,empty string,false
        if (!minrally){
            minrally = d3.min(data, function(d){
                return d.rally;
            });
        }
        if (!maxrally){
            maxrally = d3.max(data, function(d){
                return d.rally;
            });
        }
        
        console.log(minrally)
        console.log(maxrally)

        // handmade legend
        var svg_legend = d3.select("#line_chart").append("svg")
                            .attr("width", 740)
                            .attr("height", 30)

        svg_legend.append("circle").attr("cx",190).attr("cy",20).attr("r", 6).style("fill", "rgb(66,129,164)")
        svg_legend.append("circle").attr("cx",470).attr("cy",20).attr("r", 6).style("fill", "rgb(255,99,132)")
        svg_legend.append("text").attr("class", "d3_legend").attr("x", 200).attr("y", 20)
                    .text("Player A Win").style("fill","rgb(66,129,164)").attr("alignment-baseline","middle")
        svg_legend.append("text").attr("class", "d3_legend").attr("x", 480).attr("y", 20)
                    .text("Player B Win").style("fill","rgb(255,99,132)").attr("alignment-baseline","middle")

        var width = 640;
        var height = 360;

        var x = d3.scaleLinear().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .ticks(10);             //ticks : # of label 

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(5);

        var valueline = d3.line()
            .x(function (d) {
                return x(d.rally);
            })
            .y(function (d) {
                return y(d.stroke);
            });

        var svg = d3.select("#line_chart")
            .append("svg")
            .attr("width", width+100)
            .attr("height", height+100)
            .append("g");

        // Scale the range of the data
        x.domain(d3.extent(data,
            function (d) {
                return d.rally;
            }));
        y.domain([
            0, d3.max(data,
                function (d) {
                    return d.stroke;
                })
        ]);

        var axisXGrid = d3.axisTop()
            .scale(x)
            .ticks(10)
            .tickFormat("")
            .tickSize(-height,0);
        
        var axisYGrid = d3.axisLeft()
        .scale(y)
        .ticks(10)
        .tickFormat("")
        .tickSize(-width,0);
        
        svg.append('g')
        .call(axisXGrid)
        .attr("class", "y gridaxis")
        .attr("fill","none")
        .attr("transform", "translate(30,30)");
        
        svg.append('g')
        .call(axisYGrid)
        .attr("fill","none")
        .attr("class", "y gridaxis")
        .attr("transform", "translate(30,30)");

        //rendering line between interval
        svg.append("path") // Add the valueline path.
            .attr("transform", "translate(30,30)")
            .attr("d", valueline(data.filter(function(d){
                return d.rally >= minrally && d.rally <= maxrally;
            })))
            .attr("stroke","rgb(255, 210, 136)");

        //rendering line less than interval
        svg.append("path") 
            .attr("transform", "translate(30,30)")
            .attr("d", valueline(data.filter(function(d){
                return d.rally <= minrally;
            })))
            .attr("stroke","rgb(216, 212, 212)");

            // 算出贏的球種用雷達圖呈現(像是以十個回為一個window就還是可以雷達圖呈現)、選手失誤比例和得失分(怎麼贏的，得分往回推前三球種有個得分方程式，失分大概都是甚麼狀況)
// 雷達圖:戰術分析，可以藉由雷達圖看出選手是哪種類型(EX:攻擊型選手)，把分析結果顯示出來(像是少拍的時候通常都是B贏，代表A在前五拍左右的處理要再更好)，選手贏的拍數distribution，把X-Y軸的label顯示出來
// 全場失分比例要分成A跟B各自的
// 失誤:主動失誤、非受破性失誤、受迫性失誤(只是記錄用 我們不用做))
// 要有兩種網頁(一個釋放ground truth 一個是我們算出來的)
// 之後可以先用大範圍(小球=放小球 擋小球之類的)
// 掛網球、小平球拿掉
        //rendering line more than interval
        svg.append("path") 
            .attr("transform", "translate(30,30)")
            .attr("d", valueline(data.filter(function(d){
                return d.rally >= maxrally;
            })))
            .attr("stroke","rgb(216, 212, 212)");

        //draw circle points
        var circles = svg.selectAll("circle")
                                    .data(data)
                                    .enter()
                                    .append("circle");
        
        //Add the circle attributes
        var circleAttributes = circles
                                .attr("id",function(d,i) { return (d.set + '-' + d.rally)})
                                .attr("cx", function (d) { return x(d.rally); })
                                .attr("cy", function (d) { return y(d.stroke); })
                                .attr("r", function (d) { return 3.5; })
                                .attr("transform", "translate(30,30)")
                                .style("fill", function (d) { 
                                    if (d.rally < minrally || d.rally > maxrally)
                                        return "rgb(216, 212, 212)";
                                    else if(d.winner == "A")
                                        return "rgb(66,129,164)";
                                    else
                                        return "rgb(255,99,132)";
                                })
                                .on("mouseover",handleMouseOver)
                                .on("mouseout",handleMouseOut)
                                .on("click",handleMouseClick)
                                .append("a")
                                .attr("data-toggle","modal")
                                .attr("href","#radarChart");

        function handleMouseClick(d,i){
            var coords = d3.mouse(this);
            // console.log(coords);

            //get index from json file
            var id = this.id;
            console.log(id)
            $.getJSON("../statistics/rally_type.json", function(data2) {
                document.getElementById("rallytitle").innerHTML = id + ' 球種分佈圖';
                //get index from json file
                index = data2.findIndex(function(item){
                    return id == item.rally;
                });

                var labels = data2.map(function(item) {
                    return item.result.map(function(e){
                        return e.balltype;            
                    })
                });

                var dataA = []
                for(var i = 0;i<data2[index].result.length;i++){
                    dataA.push(data2[index].result[i].count)
                }

                var dataB = []
                for(var i = 0;i<data2[index+1].result.length;i++){
                    dataB.push(data2[index+1].result[i].count)
                }

                // console.log(dataA)
                // console.log(dataB)

                $("#radarChart").show(function(event){
                    var modal = $(this);
                    var canvas = modal.find('.modal-body canvas');
                    var ctx = canvas[0].getContext("2d"); 
                    var chart = new Chart(ctx, {
                        type: "radar",
                        data: {
                            labels: labels[0],
                            datasets: [
                                {
                                label: "Player A",
                                fill: true,
                                backgroundColor: "rgba(66,129,164,0.2)",
                                borderColor: "rgba(66,129,164,0.8)",
                                pointBorderColor: "#fff",
                                pointBackgroundColor: "rgba(66,129,164,1)",
                                data: dataA
                                }, {
                                label: "Player B",
                                fill: true,
                                backgroundColor: "rgba(255,99,132,0.2)",
                                borderColor: "rgba(255,99,132,1)",
                                pointBorderColor: "#fff",
                                pointBackgroundColor: "rgba(255,99,132,1)",
                                pointBorderColor: "#fff",
                                data: dataB
                                }
                            ]
                        },
                        options: {
                            scale:{
                                ticks:{
                                    min:0,
                                    stepSize:1
                                },
                                pointLabels: { 
                                    fontSize:14 
                                }
                            },
                            legend:{
                                labels:{
                                    fontColor: 'rgba(248, 184, 82, 1)',
                                    fontSize: 16
                                }
                            }
                        }
                    });
                });

            });
        }

        //handleMouseOver & handleMouseOut not working yet
        function handleMouseOver(d,i){
            d3.select(this).attr("r",7);
            // console.log("OVER");
        }

        function handleMouseOut(d,i){
            d3.select(this).attr("r",4);
            // console.log("LOO");
        }

        // text value on each points
        for (var i in data){
            svg.append("text")
                .data(data)
                .attr("x", x(data[i]["rally"])-3)
                .attr("y", y(data[i]["stroke"])-5)
                .text(data[i]["stroke"])
                .attr("transform", "translate(30,30)")
                .attr("font-size", "15px")
                .attr("fill","blue");
        }    

        svg.append("g") // Add the X Axis
            .attr("class", "x axis")
            .attr("transform", "translate(30," + String(height+30) + ")")
            .call(xAxis);

        svg.append("g") // Add the Y Axis
            .attr("class", "y axis")
            .attr("transform", "translate(30,30)")
            .call(yAxis);

        //close modal chart
        $(function() {
            $('.close').click(function() {
                $('#radarChart').hide(function(event){
                    var modal = $(this);
                    var canvas = modal.find('.modal-body canvas');
                    var ctx = canvas[0].getContext("2d"); 
                    $(".modal-body canvas").remove();
                    $(".modal-body").html('<canvas id="canvas" width="1000" height="800"></canvas>');
                    // console.log("CLOSE")
                });
            });
        });
    })
}

function init_on_off_court(minrally,maxrally){
    var chartRadarDOM;
    var chartRadarData;
    var chartRadarOptions;

    // Chart.defaults.global.responsive = false;
    chartRadarDOM = document.getElementById("on_off_court_chart");
    //custormized options
    chartRadarOptions = 
    {
        legend:{
            labels:{
                fontColor: 'rgba(248, 184, 82, 1)',
                fontSize: 16,
                fontStyle: "bold"
            }
        }
        // responsive:false
    };

    $.getJSON("statistics/on_off_court.json", function(data) {
        // init minrally and maxrally if are undefined,null,0,NaN,empty string,false
        if (!minrally){
            minrally = Math.min.apply(Math, data.map(function(d) { 
                return d.rally; 
            }));
        }
        if (!maxrally){
            maxrally = Math.max.apply(Math, data.map(function(d) { 
                return d.rally; 
            }));
        }

        //count each reason
        var group_data = Object.keys(_.groupBy(data,"on_off_court"))
        var sum_data = new Array(group_data.length).fill(0);
        for(var i = parseInt(minrally);i<=parseInt(maxrally);i++){
            sum_data[data[i-1].on_off_court] += 1;
        }
        console.log(sum_data)
        
        var labels = ["球場內","球場外","掛網"]

        //random color generator
        color = new Array();
        for(var i = 0;i<data.length;i++){
            r = Math.floor(Math.random() * 256);
            g = Math.floor(Math.random() * 256);
            b = Math.floor(Math.random() * 256);
            color.push('rgb(' + r + ', ' + g + ', ' + b + ')');
        }
        
        var chart = new Chart(chartRadarDOM, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    backgroundColor: color,
                    pointBorderColor: "rgba(0,0,0,0)",
                    borderColor: 'rgb(17, 16, 17)',
                    borderWidth: 1,
                    data: sum_data
                }]
            },
            options: chartRadarOptions
        });
    });
}

function init_total_balltype(minrally,maxrally){
    $.getJSON("../statistics/rally_type.json", function(data) {
        var labels = data.map(function(item) {
            return item.result.map(function(e){
                return e.balltype;            
            })
        });

        var total = data.map(function(item){
            return item.result
        });

        var dataA = new Array(data[0].result.length).fill(0);
        var dataB = new Array(data[0].result.length).fill(0);
        for(var i = 0;i<data.length;i+=2){
            rally = parseInt(data[i].rally.split("-")[1]);
            if (rally < minrally || rally > maxrally)
                continue
            for(var j = 0;j<data[i].result.length;j++){
                dataA[j] += data[i].result[j].count;
                dataB[j] += data[i+1].result[j].count
            }
        };

        var canv = document.createElement('canvas');
        canv.id = 'total_balltype_chart';
        canv.width = 800;
        canv.height = 600;
        document.getElementById("total_balltype").appendChild(canv);

        var chartRadarDOM;
        var chartRadarData;
        var chartRadarOptions;

        // Chart.defaults.global.responsive = false;
        chartRadarDOM = document.getElementById("total_balltype_chart");
        //custormized options
        chartRadarOptions = 
        {
            scale:{
                ticks:{
                    min:0,
                    // stepSize:10
                },
                pointLabels: { 
                    fontSize:14 
                }
            },
            legend:{
                labels:{
                    fontColor: 'rgba(248, 184, 82, 1)',
                    fontSize: 16
                }
            }
        };
        
        var chart = new Chart(chartRadarDOM, {
            type: 'radar',
            data:{
                labels: labels[0],
                datasets: [
                    {
                    label: "Player A",
                    fill: true,
                    cubicInterpolationMode:"monotone",
                    backgroundColor: "rgba(66,129,164,0.2)",
                    borderColor: "rgba(66,129,164,1)",
                    pointBorderColor: "#fff",
                    pointBackgroundColor: "rgba(66,129,164,1)",
                    data: dataA
                    }, {
                    label: "Player B",
                    fill: true,
                    cubicInterpolationMode:"monotone",
                    backgroundColor: "rgba(255,99,132,0.2)",
                    borderColor: "rgba(255,99,132,1)",
                    pointBorderColor: "#fff",
                    pointBackgroundColor: "rgba(255,99,132,1)",
                    pointBorderColor: "#fff",
                    data: dataB
                    }
                ]
            },
            options: chartRadarOptions
        });
    });
}

function change_interval(){
    //get interval when clicking submit
    var minrally = document.getElementById("down").value;
    var maxrally = document.getElementById("up").value;

    //delete old linechart
    d3.selectAll("svg").remove();
    init_linechart(minrally, maxrally);

    //delete old doughnut
    $('#on_off_court_chart').remove();
    $('#on_off_court').html('<div class="subtitle">全場失分比例</div>\
    <canvas id="on_off_court_chart" width="800" height="600"></canvas>'); 
    init_on_off_court(minrally,maxrally);

    //delete old radar
    $('#total_balltype_chart').remove();
    $('#total_balltype').html('<div class="subtitle">全場球種統計</div>'); 
    init_total_balltype(minrally,maxrally);
}

function get_interval_up(){
    $.getJSON("../statistics/rally_type.json", function(data) {
        var i;
        for(i=1;i<=data.length/2;i+=1)
        {
            var insertText = '<option value='+i+'>'+i+'</option>';
            //document.getElementById("up").appendChild=insertText;
            $('#up').append(insertText); 
        }
    });
}
function get_interval_down(){
    $.getJSON("../statistics/rally_type.json", function(data) {
        var i;
        for(i=1;i<=data.length/2;i+=1)
        {
            var insertText = '<option value='+i+'>'+i+'</option>';
            $('#down').append(insertText); 
            //document.getElementById("down").appendChild=insertText;
        }
    });
}