/***************************************************************************

    These functions can be used to serialize and unserialize data in a
    format compatible with PHP's native serialization functions.
    They haven't been tested extensively, please let me know if you
    find bugs or make improvements.
    
    Copyright (C) 2005 Arpad Ray <arpad@rajeczy.com>

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Lesser General Public
    License as published by the Free Software Foundation; either
    version 2.1 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public
    License along with this library; if not, write to:
    Free Software Foundation, Inc.,
    51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

***************************************************************************/

/**
 *  Serializes a variable
 *
 *  @param     inp
 *    the variable to serialize
 *  @return    string
 *    a string representation of the input, which can be reconstructed by unserialize()
 *  @author
 *    Arpad Ray <arpad@rajeczy.com>
 *  @version
 *    2005/9/29
 */
function serialize(inp)
{
    var type = gettype(inp);
    var val;
    switch (type) {
        case "boolean":
            val = "b:" + (inp ? "1" : "0");
            break;
        case "number":
            val = (Math.round(inp) == inp ? "i" : "d") + ":" + inp;
            break;
        case "string":
            val = "s:" + inp.length + ":\"" + inp + "\"";
            break;
        case "array":
            val = "a";
        case "object":
            if (type == "object") {
                var objname = inp.constructor.toString().match(/(\w+)\(\)/);
                if (objname == undefined) {
                    return;
                }
                val = "O" + serialize(objname[1]).substring(1);
            }
            var count = 0;
            var vals = "";
            for (key in inp) {
                vals += serialize(key) + ";" + serialize(inp[key]);
                if (vals.charAt(vals.length - 1) != "}") {
                    vals += ";";
                }
                count++;
            }
            val += ":" + count + ":{" + vals + "}";
            break;
    }
    return val;
}

/**
 *  Reconstructs a serialized variable
 *
 *  @param      inp
 *    the string to reconstruct
 *  @return     mixed
 *    the variable represented by the input string
 *  @author
 *    Arpad Ray <arpad@rajeczy.com>
 *  @version
 *    2005/9/29
 */
function unserialize(inp)
{
    if (!inp || inp.length < 3) {
        return;
    }
    var val, kret, vret, cval;
    var type = inp.charAt(0);
    var cont = inp.substring(2);
    var size = 0;
    var divpos = 0;
    var endcont = 0;
    var rest = "";

    switch (type) {
        case "b": // boolean
            val = (cont.charAt(0) == "1");
            rest = cont.substring(1);
            break;
        case "s": // string
            val = "";
            divpos = cont.indexOf(":");
            if (divpos == -1) {
                return;
            }
            size = parseInt(cont.substring(0, divpos));
            if (size == 0) {
                rest = cont.substring(divpos + 4);
                break;
            }
            val = cont.substring(divpos + 2, divpos + 2 + size);
            rest = cont.substring(divpos + 4 + size);
            break;
        case "i": // integer
        case "d": // float
            endcont = cont.length;
            for (var i = 0; i < cont.length; i++) {
                cval = (type == "i" ? parseInt(cont.charAt(i)) : parseFloat(cont.substring(0, i + 1)));
                if (isNaN(cval)) {
                    endcont = i;
                    break;
                }
            }
            if (!endcont) {
                return;
            }
            val = cont.substring(0, endcont);
            val = (type == "i" ? parseInt(val) : parseFloat(val));
            rest = cont.substring(endcont + 1);
            break;
        case "a": // array
        if (cont.length < 4) {
                return;
            }
            divpos = cont.indexOf(":", 1);
        if (divpos == -1) {
                return;
            }
            size = parseInt(cont.substring(1, divpos - 1));
            cont = cont.substring(divpos + 2);
            val = new Array();
            if (cont.length < 1) {
                break;
            }
            for (var i = 0; i + 1 < size * 2; i += 2) {
                kret = unserialize(cont, 1);
        if (kret == undefined || kret[0] == undefined || kret[1] == "") {
                    break;
                }
                vret = unserialize(kret[1], 1);
        if (vret == undefined || vret[0] == undefined) {
                    break;
                }
                val[kret[0]] = vret[0];
                cont = vret[1];
            }
            rest = (vret ? vret[1].substring(1) : "");
            break;
        case "O": // object
            divpos = cont.indexOf(":");
            if (divpos == -1) {
                return;
            }
            size = parseInt(cont.substring(0, divpos));
            var objname = cont.substring(divpos + 2, divpos + 2 + size);
            var objprops = unserialize("a:" + cont.substring(divpos + 4 + size));
            if (objprops == undefined) {
                return;
            }
            var objout = "function " + objname + "(){";
            for (key in objprops) {
                objout += "this." + key + "=objprops[key];";
            }
            objout += "}val=new " + objname + "();";
            eval(objout);  
    }
    return (arguments.length == 1 ? val : [val, rest]);
}

/**
 *  Returns the type of a variable or its primitive equivalent
 *
 *  @param      inp
 *    the input variable
 *  @return     mixed
 *    a string as returned by typeof
 *  @author
 *    Arpad Ray <arpad@rajeczy.com>
 *  @version
 *    2005/9/29
 */
function gettype(inp)
{
    var type = typeof inp;
    if (type == "object") {
        var cons = inp.constructor.toString().toLowerCase();
        var types = ["boolean", "number", "string", "array"];
        for (key in types) {
            if (cons.indexOf(types[key]) != -1) {
                type = types[key];
                break;
            }
        }
    }
    return type;
}
