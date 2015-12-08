function paperAddOn(paper, panB, zoomB, touchEvents, initialScale){
    var viewBoxWidth, viewBoxHeight, decimalDigit, touchEvents;

    if (paper.touchEnabled == null){
        paper.touchEnabled = false;
    }

    touchEvents = touchEvents || false;

    paper["dx"]=0;
    paper["dy"]=0;
    paper["scale"] = paper["scale"] || 1;
    paper["oldScale"] = paper["scale"];

    decimalDigit = paper["decimalDigit"] || 2;
    viewBoxWidth  = paper.width;
    viewBoxHeight = paper.height;

    paper["actualWidth"] = viewBoxWidth;
    paper["actualHeight"] = viewBoxHeight;

    this.centerIn = function(center){
        paper["dx"] -= (paper["actualWidth"]/2) - parseFloat((center.x));
        paper["dy"] -= (paper["actualHeight"]/2) - parseFloat((center.y));
        paper.setViewBox(paper["dx"], paper["dy"], paper["actualWidth"], paper["actualHeight"]);
    };

    this.scale = function(value){
        paper["oldScale"] = paper["scale"];

        paper["scale"] *= value;

        paper["actualWidth"] = (paper["scale"]  * viewBoxWidth).toFixed(decimalDigit);
        paper["actualHeight"] = (paper["scale"]  * viewBoxHeight).toFixed(decimalDigit);

        paper["dx"] -= ((paper["dx"] * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));
        paper["dy"] -= ((paper["dy"] * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));

        paper.setViewBox(paper["dx"], paper["dy"], paper["actualWidth"], paper["actualHeight"]);

    };


    this.fixedZoom = function(delta){
        var x1, y1, maxZoom, minZoom;

        paper["oldScale"] = paper["scale"];

        maxZoom = paper["maxZoom"] || 4;
        minZoom = paper["minZoom"] || 0.1;

        paper["scale"] += (delta > 0) ? -0.1 : 0.1;
        paper["scale"]  = Math.max(paper["scale"] , minZoom);
        paper["scale"]  = Math.min(paper["scale"] , maxZoom);

        //event = addOffset(event, paper.node , true);
        x1 = viewBoxWidth/2;
        y1 = viewBoxHeight/2;


        paper["actualWidth"] = (paper["scale"]  * viewBoxWidth).toFixed(decimalDigit);
        paper["actualHeight"] = (paper["scale"]  * viewBoxHeight).toFixed(decimalDigit);

        paper["dx"] -= ((x1 * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));
        paper["dy"] -= ((y1 * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));

        paper.setViewBox(paper["dx"], paper["dy"], paper["actualWidth"], paper["actualHeight"]);
    };

    this.zoom = function(paper){
        var maxZoom, minZoom, oldScale;

        maxZoom = paper["maxZoom"] || 4;
        minZoom = paper["minZoom"] || 0.1;

        function handle(event, delta) {
            event.preventDefault();
            var x1, y1;

            paper["oldScale"] = paper["scale"];

            paper["scale"] += (delta > 0) ? -0.1 : 0.1;
            paper["scale"]  = Math.max(paper["scale"] , minZoom);
            paper["scale"]  = Math.min(paper["scale"] , maxZoom);

            event = addOffset(event, paper.node , true);
            x1 = event.offsetX;
            y1 = event.offsetY;


            paper["actualWidth"] = (paper["scale"]  * viewBoxWidth).toFixed(decimalDigit);
            paper["actualHeight"] = (paper["scale"]  * viewBoxHeight).toFixed(decimalDigit);

            paper["dx"] -= ((x1 * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));
            paper["dy"] -= ((y1 * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));

            paper.setViewBox(paper["dx"], paper["dy"], paper["actualWidth"], paper["actualHeight"]);
        }

        // For mobile devices
        if (touchEvents == true){
            var tch1, tch2, x1, y1, d1, d2;

            paper.node.bind("touchstart", function(event){
                if (paper.touchEnabled == true){
                    event.preventDefault();
                    var subX, subY, touches;

                    touches = event.originalEvent.touches;

                    tch1 = [touches[0].pageX, touches[0].pageY];

                    try{ // Zoom
                        tch2 = [touches[1].pageX, touches[1].pageY];

                        subX = tch1[0] - tch2[0];
                        subY = tch1[1] - tch2[1];

                        d1 = Math.sqrt((subX*subX)+(subY*subY));

                        //We save the initial midpoint of the first two touches to say where our transform origin is.
                        x1 = (tch1[0]+tch2[0])/2;
                        y1 = (tch1[1]+tch2[1])/2;

                    }catch(e){ // Drag
                        x1 = tch1[0];
                        y1 = tch1[1];
                    }
                }
            });


            paper.node.bind("touchmove", function(event) {
                if (paper.touchEnabled==true){
                    var subX, subY, touches, scaleFactor, subPos, absSubPos;
                    event.preventDefault();
                    touches = event.originalEvent.touches;

                    try{ //Zoom
                        subX = touches[0].pageX - touches[1].pageX;

                        subY = touches[0].pageY - touches[1].pageY;

                        paper["oldScale"]=paper["scale"];
                        d2 = Math.sqrt((subX*subX)+(subY*subY));
                        subPos = d1-d2;

                        absSubPos = Math.abs(subPos);

                        scaleFactor = absSubPos * (subPos > 0)?1.1:0.9;

                        paper["scale"] = paper["oldScale"]*scaleFactor;
                        paper["scale"]  = Math.max(paper["scale"] , minZoom);
                        paper["scale"]  = Math.min(paper["scale"] , maxZoom);

                        paper["actualWidth"] = (paper["scale"]  * viewBoxWidth).toFixed(decimalDigit);
                        paper["actualHeight"] = (paper["scale"]  * viewBoxHeight).toFixed(decimalDigit);

                        paper["dx"] -= ((x1 * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));
                        paper["dy"] -= ((y1 * (paper["scale"] - paper["oldScale"])).toFixed(decimalDigit));

                    }catch(e){ //Drag

                        paper["dx"] -= ((touches[0].pageX - x1) * paper["scale"]);
                        paper["dy"] -= ((touches[0].pageY - y1) * paper["scale"]);

                        x1 = touches[0].pageX;
                        y1 = touches[0].pageY;
                    }
                    paper.setViewBox(paper["dx"], paper["dy"], paper["actualWidth"], paper["actualHeight"]);
                }
            });
            paper.node.bind("touchend", function(event) {
                if (paper.touchEnabled == true){
                    event.preventDefault();
                }
            });
        }

        paper.node.bind('mousewheel', handle);
    };

    this.pan = function(paper){
        var ox, oy, dy, clicked, x, y;

        clicked = false;

        paper.node.mousedown(function(event){
            ox = event.clientX;
            oy = event.clientY;
            clicked=true;
        });

        paper.node.mouseup(function(){
            clicked = false;
        });

        paper.node.mousemove(function(event){
            if (clicked == true){
                x = event.clientX;
                y = event.clientY;

                paper["dx"] -= ((x-ox) * paper["scale"]);
                paper["dy"] -= ((y-oy) * paper["scale"]);

                ox = event.clientX;
                oy = event.clientY;

                paper.setViewBox(paper["dx"], paper["dy"],  paper["actualWidth"],  paper["actualHeight"]);
            }
        });

    };

    if (zoomB)
        this.zoom(paper);
    if (panB)
        this.pan(paper);

    if (initialScale)
        this.scale(initialScale);
}