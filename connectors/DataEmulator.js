/**
 * Author: Max
 * Date: 05/09/2015
 * Please refer to LICENSE.txt for information about the license.
 */


var DataEmulator = function(){

    this._usedSources = {};
    this._usedNodes = {};
    this._usedPaths = {};
    this._target = {
        as_number: 3333,
        owner: "OWNER",
        prefix: "193.0.0.0/21"
    };

    this._getUsedSource = function(){
        var position, usedSources;

        usedSources = Object.keys(this._usedSources);
        position = Math.floor((Math.random() * usedSources.length) + 1);

        return this._usedSources[position];
    };

    this._getUsedPath = function(source, target){
        var position, usedPaths, key;

        key = source.as_number + "-" + target.as_number;
        if (this._usedPaths[key]){
            usedPaths = Object.keys(this._usedPaths[key]);
            position = Math.floor((Math.random() * usedPaths.length) + 1);

            return this._usedPaths[usedPaths[position]];
        } else {
            this._usedPaths[key] = [];
            return null;
        }
    };

    this._generateAsNumber = function(){
        return parseInt((Math.random() * 50000) + 1)
    };

    this._generateSource = function(){
        var asNumber = this._generateAsNumber();
        return {
            "as_number": asNumber,
            "rrc": "00",
            "id": "00-111.91.233." + asNumber,
            "ip": "111.91.233." + asNumber
        };
    };

    this._getSource = function(){
        var source;

        if ((new Date()).getTime() % 2 == 0){
            source = this._generateSource();
            this._usedSources[source.as_number] = source;
        } else {
            source = this._getUsedSource();
            if (!source){
                source = this._generateSource();
                this._usedSources[source.as_number] = source;
            }
        }

        return source;
    };

    this._generatePath = function(source, target){
        var numberItems, path;

        path = [];
        numberItems = parseInt((Math.random() * 5) + 2);
        path.push(source);
        for (var i = 0; i < numberItems; i++) {
            path.push(this._getNode());
        }
        path.push(target);

        return path;
    };

    this._getPath = function(source, target){
        var path, key;

        key = source.as_number + "-" + target.as_number;
        if ((new Date()).getTime() % 2 == 0){
            path = this._generatePath(source, target);
            this._usedPaths[key] = this._usedPaths[key] || [];
            this._usedPaths[key].push(path);
        } else {
            path = this._getUsedPath(source, target);
            if (!path){
                path = this._generatePath(source, target);
                this._usedPaths[key].push(path);
            }
        }

        return path;
    };

    this._generateNode = function(){
        return {
            owner: "OWNER",
            as_number: this._generateAsNumber()
        }
    };

    this._getUsedNode = function(){
        var position, usedNodes;

        usedNodes = Object.keys(this._usedNodes);
        position = Math.floor((Math.random() * usedNodes.length) + 1);

        return this._usedNodes[position];
    };

    this._getNode = function(){
        var node;
        if ((new Date()).getTime() % 2 != 0){
            node = this._generateNode();
            this._usedNodes[node.as_number] = node;
        } else {
            node = this._getUsedNode();
            if (!node){
                node = this._generateNode();
                this._usedNodes[node.as_number] = node;
            }
        }

        return node;
    };

    this._generateItem = function(){
        var source;

        source = this._getSource();
        return {
            type: "A",
            timestamp: parseInt(new Date().getTime()/1000),
            source: source,
            path: this._getPath(source, this._target),
            community: [[1,2], [3,4]]
        };
    };


    this.start = function(callback){
        var $this;

        $this = this;
        //callback(this._generateItem());
        setTimeout(function(){
            callback($this._generateItem());
        }, 1000);

        setInterval(function(){
            callback($this._generateItem());
        }, 20000);
    };

};