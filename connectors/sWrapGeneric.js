/**
 * Copyright 2015 - mcandela
 * Date: 07/09/15
 * Time: 13:21
 */


function SWrap(environment){
    var bgplay, uniquePath, incrementalEventId, incrementalPathId;


    bgplay = environment.bgplay;

    uniquePath = environment.uniquePath || {};
    incrementalEventId = environment.incrementalEventId || 0;
    incrementalPathId = 0;

    this._createNode = function(node){
        var asnumber, newnode;

        asnumber = node.as_number;
        newnode = new Node({
            id: asnumber,
            asnumber: asnumber,
            as: asnumber,
            owner: node.owner,
            nodeUrl: "https://stat.ripe.net/AS" + asnumber,
            environment: environment,
            new: true
        });
        bgplay.addNode(newnode);
    };

    this._createSource = function(source){
        var sourceNode, newsource;

        sourceNode = bgplay.getNode(source.as_number);
        newsource = new Source({
            id: source.id,
            group: sourceNode,
            environment: environment,
            new: true
        });
        bgplay.addSource(newsource);
        if (sourceNode != null) {
            sourceNode.addSource(newsource);
        }
    };


    this._createTarget = function(target){
        var newtarget;
        newtarget = new Target({
            id: target.prefix,
            environment: environment
        });
        bgplay.addTarget(newtarget);
    };

    this._createEvent = function(event){
        var ignoreReannouncements, eventType, source, target, prevPath, currentPath, instant, path, pathsNumber,
            tmpEvent, tmpPath, shortdescription, longdescription, subType, tmpNode, length2, i;

        ignoreReannouncements = (environment.params.ignoreReannouncements || environment.config.ignoreReannouncementsByDefault);

        eventType = event.type;
        source = bgplay.getSource(event.source.id);
        target = bgplay.getTarget(event.path[event.path.length - 1].prefix);

        prevPath = uniquePath[source.id + "-" + target.id];
        pathsNumber = Object.keys(uniquePath).length;

        currentPath = (event.path && event.path.length > 0) ? $.map(event.path, function(item){return item.as_number;}).join(" ") : "";
        instant = new Instant({
            id: incrementalEventId,
            timestamp: event.timestamp,
            environment: environment
        });

        path = new Path({
            id: incrementalPathId + pathsNumber,
            announcedPath: currentPath,
            target: target,
            source: source,
            environment: environment
        });

        incrementalPathId++;

        tmpEvent = new Event({
            source: source,
            target: target,
            type: eventType,
            instant: instant,
            community: (event.community) ? event.community.join(",") : null,
            environment: environment,
            new: true
        });

        tmpPath = event.path;

        if (eventType == 'W' && prevPath != null){

            shortdescription = "The route " + prevPath.toString() + " has been withdrawn.";
            longdescription = "The route " + prevPath.toString() + " has been withdrawn...more";
            subType = "withdrawal";
            tmpEvent.attributes.path = null;

        }else if (eventType == 'A' || eventType == 'B'){

            tmpNode = bgplay.getNode(tmpPath[tmpPath.length - 1]["as_number"]);
            tmpNode.addTarget(target);//In this way we can check hijacking
            if (!arrayContains(target.get("nodes"), tmpNode)){
                target.addNode(tmpNode);
            }
            length2 = tmpPath.length;
            for (i=0; i<length2; i++){
                if (!tmpPath[i-1] || tmpPath[i-1] != tmpPath[i])
                    path.addNode(bgplay.getNode(tmpPath[i]["as_number"]));
            }

            if (prevPath == null){

                shortdescription = "The new route " + path.get('announcedPath') + " has been announced";
                longdescription = "The new route " + path.get('announcedPath') + " has been announced..more";
                subType = "announce";
                tmpEvent.attributes.path = path; //The new path

            }else{

                if (prevPath.toString() == path.toString()){
                    if (prevPath.get('announcedPath') == path.get('announcedPath')){
                        if (!ignoreReannouncements){
                            shortdescription = "The route " + prevPath.get('announcedPath') + " has been announced again";
                            longdescription = "The route " + prevPath.get('announcedPath') + " has been announced again..more";
                            subType = "reannounce";
                            tmpEvent.attributes.path = prevPath; //The previous path
                        } else {
                            return; //skip re-announcements
                        }
                    } else {
                        shortdescription = "The route " + prevPath.get('announcedPath') + " introduced/removed prepending " + path.get('announcedPath');
                        longdescription = "The route " + prevPath.get('announcedPath') + " introduced/removed prepending " + path.get('announcedPath') + " ..more";
                        subType = "prepending";
                        tmpEvent.attributes.path = path;
                    }
                } else {
                    shortdescription = "The route " + prevPath.get('announcedPath') + " is changed to " + path.get('announcedPath');
                    longdescription = "The route " + prevPath.get('announcedPath') + " is changed to " + path.get('announcedPath') + " ..more";
                    subType = "pathchange";
                    tmpEvent.attributes.path = path;//The new path
                }
            }
        }
        uniquePath[source.id + "-" + target.id] = tmpEvent.attributes.path;
        tmpEvent.attributes.shortdescription = shortdescription;
        tmpEvent.attributes.longdescription = longdescription;
        tmpEvent.attributes.prevPath = prevPath;
        tmpEvent.attributes.subType = subType;
        source.addEvent(tmpEvent);
        bgplay.get("allEvents").put(instant, tmpEvent);
        incrementalEventId++;
    };


    this._createNodes = function(event){
        var node;

        for (var n=0,length=event.path.length; n<length; n++){
            node = bgplay.getNode(event.path[n]["as_number"]);
            if (!node){
               this._createNode(event.path[n]);
            }
        }

    };


    this.sampleCallback = function(event){

        this._createNodes(event);
        this._createSource(event.source);
        this._createTarget(event.path[event.path.length - 1]);
        this._createEvent(event);
        //bgplay.updateState();
    };

}