/**
 * Copyright 2015 - mcandela
 * Date: 07/09/15
 * Time: 13:21
 */


function JsonWrap(environment){
    var bgplay, uniquePath;

    bgplay = environment.bgplay;

    uniquePath = environment.uniquePath || [];

    this._createNode = function(node){
        var asnumber, newnode;

        asnumber = node.as_number;
        newnode = new Node({
            id: asnumber,
            asnumber: asnumber,
            as: asnumber,
            owner: node.owner,
            nodeUrl: "https://stat.ripe.net/AS" + asnumber,
            environment: environment
        });
        bgplay.addNode(newnode);
    };

    this._createSource = function(source){
        var sourceNode, newsource;

        sourceNode = bgplay.getNode(source.as_number);
        newsource = new Source({
            id: source.id,
            group: sourceNode,
            environment: environment
        });
        bgplay.addSource(newsource);
        if (sourceNode != null) {
            sourceNode.addSource(newsource);
        }
    };


    this._createTarget = function(target){
        var newtarget;
        newtarget = new Target({id: target.prefix, environment: environment});
        bgplay.addTarget(newtarget);
    };

    this._createEvent = function(event){
        var ignoreReannouncements, eventType, source, target, prevPath;

        ignoreReannouncements = (environment.params.ignoreReannouncements || environment.config.ignoreReannouncementsByDefault);

        eventType = event.type;
        source = bgplay.getSource(event.source.id);
        target = bgplay.getTarget(event.path[event.path.length - 1].prefix);

        prevPath = uniquePath[source.id + "-" + target.id];

        currentPath = (attributes.path) ? attributes.path.join(" ") : "";
        instant = new Instant({id:event_id, timestamp: event.timestamp, environment:environment});
        path = new Path({id:n+path_start_id, announcedPath:currentPath, target:target, source:source, environment:environment});//n is a good id (must be integer)
        tmpEvent = new Event({source:source, target:target, type:event.type, instant:instant, community:(attributes.community)?attributes.community.join(","):null, environment:environment});
        tmpPath = attributes.path;

        if (eventType=='W' && prevPath!=null){
            shortdescription = "The route "+ prevPath.toString()+" has been withdrawn.";
            longdescription = "The route "+ prevPath.toString()+" has been withdrawn...more";
            subType = "withdrawal";
            tmpEvent.attributes.path = null;
        }else if (eventType=='A' || eventType=='B'){

            tmpNode = bgplay.getNode(tmpPath[tmpPath.length-1]);
            tmpNode.addTarget(target);//In this way we can check hijacking
            if (!arrayContains(target.get("nodes"),tmpNode)){
                target.addNode(tmpNode);
            }

            length2 = tmpPath.length;

            for (i=0; i<length2; i++){
                if (!tmpPath[i-1] || tmpPath[i-1]!=tmpPath[i])
                    path.addNode(bgplay.getNode(tmpPath[i]));
            }

            if (prevPath==null){
                shortdescription = "The new route "+ path.get('announcedPath')+" has been announced";
                longdescription = "The new route "+ path.get('announcedPath')+" has been announced..more";
                subType = "announce";
                tmpEvent.attributes.path = path; //The new path
            }else{
                if (prevPath.toString()==path.toString()){
                    if (prevPath.get('announcedPath')==path.get('announcedPath')){
                        if (!ignoreReannouncements){
                            shortdescription = "The route "+ prevPath.get('announcedPath')+" has been announced again";
                            longdescription = "The route "+ prevPath.get('announcedPath')+" has been announced again..more";
                            subType = "reannounce";
                            tmpEvent.attributes.path = prevPath; //The previous path
                        }else{
                            continue; //skip re-announcements
                        }
                    }else{
                        shortdescription = "The route "+ prevPath.get('announcedPath')+" introduced/removed prepending "+path.get('announcedPath');
                        longdescription = "The route "+ prevPath.get('announcedPath')+" introduced/removed prepending "+path.get('announcedPath')+" ..more";
                        subType = "prepending";
                        tmpEvent.attributes.path = path;
                    }
                }else{
                    shortdescription = "The route "+ prevPath.get('announcedPath')+" is changed to "+path.get('announcedPath');
                    longdescription = "The route "+ prevPath.get('announcedPath')+" is changed to "+path.get('announcedPath')+" ..more";
                    subType = "pathchange";
                    tmpEvent.attributes.path = path;//The new path
                }
            }
        }
        uniquePAth[source.id+"-"+target.id] = tmpEvent.attributes.path;
        tmpEvent.attributes.shortdescription = shortdescription;
        tmpEvent.attributes.longdescription = longdescription;
        tmpEvent.attributes.prevPath = prevPath;
        tmpEvent.attributes.subType = subType;
        source.addEvent(tmpEvent);
        bgplay.get("allEvents").put(instant,tmpEvent);
        event_id++;
    };




    return {


        readJson:function(wrap){

            function createInitialState(wrap){
                var path, event, initialstate, source, tmpPath, target, tmpNode, states, length, uniquePAth, n, length2, i;
                uniquePAth=[];
                states = wrap.initial_state;
                length = states.length;
                for (n=0; n<length; n++){
                    initialstate = states[n];

                    target=bgplay.getTarget(initialstate.target_prefix);
                    source=bgplay.getSource(initialstate.source_id);

                    if (initialstate.path.length==0){
                        continue;
                    }

                    path=new Path({id:n,announcedPath:initialstate.path.join(" "), target:target, source:source, environment:environment});
                    uniquePAth[source.id+"-"+target.id]=path;

                    tmpPath=initialstate.path;

                    tmpNode = bgplay.getNode(tmpPath[tmpPath.length-1]);
                    tmpNode.addTarget(target); //In this way we can check hijacking
                    if (!arrayContains(target.get("nodes"),tmpNode)){
                        target.addNode(tmpNode);
                    }

                    length2 = tmpPath.length;
                    for (i= 0; i<length2; i++){
                        if (!tmpPath[i-1] || tmpPath[i-1] != tmpPath[i]){
                            path.addNode(bgplay.getNode(tmpPath[i]));
                        }
                    }
                    event = new Event({subType:"initialstate", type:"initialstate", source:source, target:target, path:path, instant:bgplay.get("cur_instant"), environment:environment});
                    source.addEvent(event);
                    bgplay.get("allEvents").put(bgplay.get("cur_instant"),event);
                }
                return uniquePAth;
            }

            function createEvents(uniquePAth,wrap){
                var event_id=1;
                var events, event, n, i, length2, tmpNode, instant, eventType, currentPath, attributes, shortdescription, source, longdescription, path, target, tmpEvent, prevPath, tmpPath, subType, numNotValidWithdrawal, length;
                var ignoreReannouncements = (environment.params.ignoreReannouncements || environment.config.ignoreReannouncementsByDefault);
                var path_start_id = uniquePAth.length;

                numNotValidWithdrawal = 0;

                events = wrap.events;
                length = events.length;
                for (n=0; n<length; n++){

                }

                if (numNotValidWithdrawal>0){
                    if (numNotValidWithdrawal == 1){
                        environment.cssAlert.alert("A withdrawal applied to a not existent path","warning",3000);
                    }else{
                        environment.cssAlert.alert(numNotValidWithdrawal+"  withdrawals ignored: no referenced path","warning",3000);
                    }
                }
            }

            createNodes(wrap);
            createSources(wrap);
            createTargets(wrap);
            createEvents(createInitialState(wrap),wrap);

            bgplay.updateState();

            return true;
        }
    }
}