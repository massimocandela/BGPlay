
//##########################################################
//#### MapElement
//#### @Massimo Candela
//#### webrobotics.net
//##########################################################

var net = net || {};
net.webrobotics = net.webrobotics || {};

net.webrobotics.MapElement = function (key) {
    this.key = key;
    this.values = [];
    this.last = 0;
};

net.webrobotics.MapElement.prototype.getKey = function () {
    return this.key;
};

net.webrobotics.MapElement.prototype.addValue = function (val) {
    this.values[this.last] = val;
    this.last++;
};

net.webrobotics.MapElement.prototype.setNext = function (next) {
    this.next = next;
};

net.webrobotics.MapElement.prototype.setPrev = function (prev) {
    this.prev = prev;
};

net.webrobotics.MapElement.prototype.getNext = function () {
    return this.next;
};

net.webrobotics.MapElement.prototype.getPrev = function () {
    return this.prev;
};

net.webrobotics.MapElement.prototype.getValues = function () {
    return this.values;
};

net.webrobotics.MapElement.prototype.getLastValue = function () {
    return this.values[this.values.length - 1];
};

//##########################################################
//#### Comparator for bgplay.js
//#### @Massimo Candela
//#### webrobotics.net
//##########################################################

var comparator = function (key1, key2) {
    if (key1 < key2)
        return -1;
    else
        return (key1 > key2) ? 1 : 0;
};

//##########################################################
//#### TreeMap
//#### @Massimo Candela
//#### webrobotics.net
//##########################################################
/*
 Complexity

 insert:
 best: O(1) in loco
 average: O(log n) non in loco
 worst: O(log n) non in loco

 search:
 best: O(1)
 average: O(log n)
 worst: O(log n)

 delete:
 best: O(1) non in loco
 average: O(log n) non in loco
 worst: O(log n) non in loco

 */

net.webrobotics.TreeMap = function (comparator, options) {
    this.options = options;
    this.allowDuplicateKeys = (options) ? options.allowDuplicateKeys : true || true;
    this.suppressDuplicateKeyAlerts = (options) ? options.suppressDuplicateKeyAlerts : false || false;
    this.elements = [];
    this.comparator = comparator;
};

net.webrobotics.TreeMap.prototype.containsKey = function (element) {
    return (this.get(element) != null);
};

net.webrobotics.TreeMap.prototype.empty = function () {
    this.elements.length = 0;
};

net.webrobotics.TreeMap.prototype.isEmpty = function () {
    return (this.elements.length <= 0);
};

net.webrobotics.TreeMap.prototype.containsValue = function (element) {
    var out = this.toAny(function (current) {
        return (element == current) ? true : null;
    });
    return (out != null);
};

net.webrobotics.TreeMap.prototype.toAny = function (callback) {
    var out,length;
    var values = this.toArray();
    length=values.length;
    for (var n = length; n--;) {
        out = callback(values[n]);
        if (out != null)
            return out;
    }
};

net.webrobotics.TreeMap.prototype.forEach = function (callback) {
    var values = this.toArray();
    var length,n;
    length=values.length;

    for (n =0; n<length; n++)
        callback(values[n]);
};

//this method iterates on each key. The callback function receives as parameters key, values (array of values)
net.webrobotics.TreeMap.prototype.forEachKey = function (callback) {
    var tmpElement,length, n;
    length=this.elements.length;
    for (n =0; n<length; n++) {
        tmpElement = this.elements[n];
        callback(tmpElement.getKey(), tmpElement.getValues());
    }
};

//this method applies the callback function for each couple of element. The callback function must receive 2 elements as parameters
net.webrobotics.TreeMap.prototype.forEachCouple = function (callback) {
    var values = this.toArray();
    var i, n,length1,length2;
    length1=this.elements.length;
    for (n = length1; n--;) {
        length2=values.length;
        for (i = length2; i--;) {
            if (i != n)
                callback(values[n], values[i]);
        }
    }
};

//this function applies the callback function for each element with the provided key
net.webrobotics.TreeMap.prototype.forEachValuesWithKey = function (key, callback) {
    var values, length, n;

    values = this.get(key);
    if (values!=null){
        values = (this.allowDuplicateKeys == true) ? values : [values];
        length = values.length;

        for (n =0; n<length; n++){
            callback(values[n]);
        }
    }
};

// filteredFunction takes an element and returns a boolean value that establishes
// if the element is part of the sub-treeMap
net.webrobotics.TreeMap.prototype.getFilteredSubTreeMapByValue = function (filterFunction) {
    var newTreeMap = new net.webrobotics.TreeMap(this.comparator, this.options);
    var tmpMapElement, n, i, value, length1, length2,arrayValues;
    length1=this.elements.length;
    for (n = length1; n--;) {
        tmpMapElement = this.elements[n];
        arrayValues=tmpMapElement.getValues();
        length2=arrayValues.length;
        for (i = 0; i < length2; i++) {
            value = arrayValues[i];
            if (filterFunction(value) == true) {
                newTreeMap.put(tmpMapElement.getKey(), value);
            }
        }
    }
    return newTreeMap;
};

// filteredFunction takes a key and returns a boolean value that establishes
// if the values with this key are part of the sub-treeMap
net.webrobotics.TreeMap.prototype.getFilteredSubTreeMapByKey = function (filterFunction) {
    var newTreeMap = new net.webrobotics.TreeMap(this.comparator, this.options);
    var tmpMapElement, n, length;
    length=this.elements.length;
    for (n = length; n--;) {
        tmpMapElement = this.elements[n];
        if (filterFunction(tmpMapElement.getKey()) == true) {
            newTreeMap.elements.push(tmpMapElement);
        }
    }
    return newTreeMap;
};

net.webrobotics.TreeMap.prototype.getSubTreeMap = function (keyStart, keyStop) {
    var newTreeMap;
    var start = this.positionOf(keyStart);
    var stop = this.positionOf(keyStop);

    if (!this.elements[stop] || this.comparator(this.elements[stop].getKey(), keyStop) != 0) {
        stop--;
    }

    if (start <= stop) {
        newTreeMap = new net.webrobotics.TreeMap(this.comparator, this.options);
        newTreeMap.elements = this.elements.slice(start, stop + 1);
    }
    return newTreeMap;
};

net.webrobotics.TreeMap.prototype.size = function (duplicates) {
    if (duplicates && this.allowDuplicateKeys==true) {
        var out = 0;
        for (var n = 0; n < this.elements.length; n++) {
            out += this.elements[n].getValues().length
        }
        return out;
    } else
        return this.elements.length;
};

net.webrobotics.TreeMap.prototype.last = function () {
    var elements = this.elements[this.size() - 1].getValues();
    if (this.allowDuplicateKeys==true)
        return elements;
    else
        return elements[0];
};

net.webrobotics.TreeMap.prototype.first = function () {
    var elements = this.elements[0].getValues();
    return (this.allowDuplicateKeys==true) ? elements : elements[0];
};

net.webrobotics.TreeMap.prototype.at = function (at) {
    var elements;
    if (this.elements[at]) {
        elements = this.elements[at].getValues();
        return (this.allowDuplicateKeys==true) ? elements : elements[0];
    }
    return null;
};

net.webrobotics.TreeMap.prototype.put = function (key, value) {
    var element = new net.webrobotics.MapElement(key);
    var position, cur_element;
    element.addValue(value);

    position=this.positionOf(key);

    cur_element = this.elements[position];
    if (cur_element != null && this.comparator(cur_element.getKey(), key) == 0) {
        if (this.allowDuplicateKeys)
            cur_element.addValue(value);
        if (!this.suppressDuplicateKeyAlerts){
            try{
                console.log("Duplicate key: " + key.toString());
            }catch(e){

            }
        }
    } else {
        var tmp = [];
        tmp = tmp.concat(this.elements.slice(0, position));
        tmp.push(element);
        tmp = tmp.concat(this.elements.slice(position));
        this.elements = tmp;
    }
};

net.webrobotics.TreeMap.prototype.positionOf = function (key) {
    //fast checks
    if (this.elements.length==0) return 0;
    var tmpCompResLast = this.comparator(this.elements[this.elements.length - 1].getKey(), key);



    if (tmpCompResLast == -1)
        return this.elements.length;

    if (tmpCompResLast == 0)
        return this.elements.length - 1;

    var tmpCompResFirst = this.comparator(key, this.elements[0].getKey());
    if (tmpCompResFirst < 1)
        return 0;


    this.positionOfTR = function (key, elements, start, stop) {
        var size = (stop - start) + 1;

        var half = Math.floor((size) / 2) + start;
        var comparation = this.comparator(elements[half].getKey(), key);

        if (comparation == 0) {
            return half;
        } else {
            if (size == 1) {
                return (comparation == -1) ? start + 1 : start;
            } else {
                return (comparation == -1) ? this.positionOfTR(key, elements, half, stop) : this.positionOfTR(key, elements, start, half - 1);
            }
        }
    };
    return this.positionOfTR(key, this.elements, 0, this.elements.length - 1);
};

net.webrobotics.TreeMap.prototype.toArray = function () {
    var out = [];
    var el, n, length;
    length=this.elements.length;
    for (n = 0; n < length; n++) {
        el = this.elements[n];
        out = out.concat(el.getValues());
    }
    return out;
};

net.webrobotics.TreeMap.prototype.toMap = function () {
    var out = {};
    var el, n, length;
    for (n = 0, length=this.elements.length; n < length; n++) {
        el = this.elements[n];
        out[el.getKey()]=el.getValues();
    }
    return out;
};


net.webrobotics.TreeMap.prototype.toString = function () {
    var out = "";
    var el, n, i,length1,length2,vals,arrayValues;
    length1=this.elements.length;

    for (n = 0; n < length1; n++) {
        el = this.elements[n];
        vals = "";
        arrayValues=el.getValues();
        length2=arrayValues.length;
        for (i = 0; i < length2; i++) {
            vals += arrayValues[i] + ",";
        }
        out += "<" + el.getKey() + "," + vals + ">; ";
    }
    return out;
};

net.webrobotics.TreeMap.prototype.remove = function (key) {
    var position = this.positionOf(key);

    if (!this.elements[position] || this.comparator(this.elements[position].getKey(), key) != 0)
        return false;
    var tmp1 = [];
    if (position > 0) {
        tmp1 = tmp1.concat(this.elements.slice(0, position));
    }
    if (position < this.elements.length - 1) {
        tmp1 = tmp1.concat(this.elements.slice(position + 1));
    }
    this.elements = tmp1;
    return true;
};

net.webrobotics.TreeMap.prototype.removeValue = function (value) {
    var validSubTreemap;
    validSubTreemap = this.getFilteredSubTreeMapByValue(function(element){
        if (element == value){
            return false;
        }
        return true;
    });

    this.elements = validSubTreemap.elements;
};

net.webrobotics.TreeMap.prototype.get = function (key) {
    var position = this.positionOf(key);

    if (!this.elements[position] || this.comparator(this.elements[position].getKey(), key) != 0)
        return null;
    return this.at(position);
};

net.webrobotics.TreeMap.prototype.nearest = function (key, after, included) {
    var elements;
    var included=(included!=null)? included : true;
    var position = this.positionOf(key);

    var element = this.elements[position];

    if (element != null && this.comparator(element.getKey(), key) == 0){
        if (included != true){
            position+=(after)?+1:-1;
            return this.at(position);
        }else{
            elements = element.getValues();
            return (this.allowDuplicateKeys) ? elements : elements[0];
        }
    }

    if (after) {
        if (element != null) {
            elements = element.getValues();
            return (this.allowDuplicateKeys) ? elements : elements[0];
        }
        return null;
    }
    return this.at(position-1);
};

net.webrobotics.TreeMap.prototype.compare=function(obj1,obj2){
    return this.comparator(obj1,obj2);
}

net.webrobotics.TreeMap.prototype.clone = function (deep) {
    var out;
    if (deep==true){
        //TODO
    }else{
        out=this.elements.slice(0);
    }
    return out;
};