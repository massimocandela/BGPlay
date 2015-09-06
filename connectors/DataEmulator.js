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
        as_number: 4555,
        ip: "192.168.1.1"
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
        return {
            "as_number": this._generateAsNumber(),
            "rrc": "00",
            "id": "00-111.91.233.1",
            "ip": "111.91.233.1"
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
        path.push(source);
        numberItems = parseInt((Math.random() * 10) + 2);
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
        return {
            type: "A",
            path: this._getPath(this._getSource(), this._target)
        };
    };


    this.start = function(callback){
        var $this;

        $this = this;
        callback(this._generateItem());
        setInterval(function(){
            callback($this._generateItem());
        }, 3000);
    };

};