/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

TreeMapTest = TestCase("TreeMapTest");
var tree,tree2;

//initialization, this function will be invoked before each test.
TreeMapTest.prototype.setUp = function () {
    // create and populate the treemap
    tree = new net.webrobotics.TreeMap(comparator,{allowDuplicateKeys:true,suppressDuplicateKeyAlerts:true});
    tree.put(1, "ciao");//0
    tree.put(8, "miao");//3
    tree.put(10, "bau");//4
    tree.put(3, "gdb");//1
    tree.put(7, "titto");//2

};

TreeMapTest.prototype.testGetSubTreeMap = function () {
    tree2 = new net.webrobotics.TreeMap(comparator);
    tree2.put(1, "ciao");
    assertEquals(null, tree.getSubTreeMap(0, 0));
    assertEquals(null, tree.getSubTreeMap(9, 5));
    assertEquals(null, tree.getSubTreeMap(11, 12));

    assertEquals(tree.at(0), tree.getSubTreeMap(0, 1).at(0));
    assertEquals(1, tree.getSubTreeMap(0, 1).size());

    assertEquals(tree.at(4), tree.getSubTreeMap(10, 11).at(0));
    assertEquals(1, tree.getSubTreeMap(10, 11).size());

    assertEquals(tree.at(1), tree.getSubTreeMap(3, 8.5).at(0));
    assertEquals(tree.at(2), tree.getSubTreeMap(3, 8.5).at(1));
    assertEquals(tree.at(3), tree.getSubTreeMap(3, 8.5).at(2));
    assertEquals(3, tree.getSubTreeMap(3, 8.5).size());

    assertEquals(tree.at(0), tree.getSubTreeMap(0, 2.5).at(0));
    assertEquals(1, tree.getSubTreeMap(0, 2.5).size());
};

TreeMapTest.prototype.testPositionOf = function () {
    tree.remove(7);

    assertEquals(2, tree.positionOf(7));
    assertEquals(8, tree.elements[tree.positionOf(7)].getKey());
};

TreeMapTest.prototype.testPut = function () {
    tree = new net.webrobotics.TreeMap(comparator);

    tree.put(1, "ciao");
    assertEquals(["ciao"], tree.toArray());

    tree.put(8, "miao");
    assertEquals(["ciao", "miao"], tree.toArray());

    tree.put(10, "bau");
    assertEquals(["ciao", "miao", "bau"], tree.toArray());

    tree.put(3, "gdb");
    assertEquals(["ciao", "gdb", "miao", "bau"], tree.toArray());

    tree.put(7, "titto");
    assertEquals(["ciao", "gdb", "titto", "miao", "bau"], tree.toArray());

};

TreeMapTest.prototype.testNearest = function () {
    assertEquals(["ciao"], tree.nearest(1)); //test the first position
    assertEquals(["bau"], tree.nearest(11)); //test the last position
    assertEquals(["gdb"], tree.nearest(3));
    assertEquals(["bau"], tree.nearest(10, false));
    assertEquals(["gdb"], tree.nearest(4)); //test after=null
    assertEquals(["gdb"], tree.nearest(4, false)); //test after=false
    assertEquals(["titto"], tree.nearest(4, true)); //test after=true
};

TreeMapTest.prototype.testGet = function () {
    tree.put(7, "pizzo");
    assertEquals(["ciao"], tree.get(1)); //test the first element
    assertEquals(["titto", "pizzo"], tree.get(7)); //test with a collision
    assertEquals(["bau"], tree.get(10)); //test the last element

};

TreeMapTest.prototype.testAt = function () {
    assertEquals(["ciao"], tree.at(0));
    assertEquals(["gdb"], tree.at(1));
    assertEquals(["titto"], tree.at(2));
    assertEquals(["miao"], tree.at(3));
    assertEquals(["bau"], tree.at(4));

};

TreeMapTest.prototype.testDelete = function () {
    tree.remove(1);
    assertEquals(["gdb", "titto", "miao", "bau"], tree.toArray()); //test the first position

    tree.remove(10);
    assertEquals(["gdb", "titto", "miao"], tree.toArray()); //test the last position

    tree.remove(7);
    assertEquals(["gdb", "miao"], tree.toArray());
};

TreeMapTest.prototype.testFirstLast = function () {
    assertEquals(tree.at(0), tree.first());
    assertEquals(tree.at(tree.size() - 1), tree.last());
};

//this function will be invoked after each test.
TreeMapTest.prototype.tearDown = function () {

};

