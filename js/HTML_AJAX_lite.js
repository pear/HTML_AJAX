// Main.js
var HTML_AJAX = {
defaultServerUrl: false,
defaultEncoding: null,
fullcall: function(url,encoding,className,method,callback,args) {
var mode = 'sync';
if (callback) {
mode = 'async';
}
var dispatcher = new HTML_AJAX_Dispatcher(className,mode,callback,url,encoding,encoding);
return dispatcher.doCall(method,args);
},
call: function(className,method,callback) {
var args = new Array();
for(var i = 3; i < arguments.length; i++) {
args.push(arguments[i]);
}
var o = null;
if (callback) {
o = new Object();
o[method] = callback;
}
return HTML_AJAX.fullcall(HTML_AJAX.defaultServerUrl,HTML_AJAX.defaultEncoding,className,method,o,args);
},
grab: function(url,callback) {
var o = false;
if (callback) {
o = new Object();
o.ret = callback;
}
return HTML_AJAX.fullcall(url,'Null',false,'ret',o,{});
},
replace: function(id) {
if (arguments.length == 2) {
document.getElementById(id).innerHTML = HTML_AJAX.grab(arguments[1]);
}
else {
var args = new Array();
for(var i = 3; i < arguments.length; i++) {
args.push(arguments[i]);
}
document.getElementById(id).innerHTML = HTML_AJAX.call(arguments[1],arguments[2],false,args);
}
},
onOpen: function(className,methodName) {
var loading = document.getElementById('HTML_AJAX_LOADING');
if (!loading) {
loading = document.createElement('div');
loading.id = 'HTML_AJAX_LOADING';
loading.innerHTML = 'Loading...';
loading.style.position = 'absolute';
loading.style.top = 0;
loading.style.right = 0;
loading.style.backgroundColor = 'red';
loading.style.width = '80px';
loading.style.padding = '4px';
document.getElementsByTagName('body').item(0).appendChild(loading);
}
loading.style.display = 'block';
},
onLoad: function(className,methodName) {
var loading = document.getElementById('HTML_AJAX_LOADING');
if (loading) {
loading.style.display = 'none';
}
}
}
function HTML_AJAX_Serialize_JSON() {}
HTML_AJAX_Serialize_JSON.prototype = {
contentType: 'application/json; charset=UTF-8',
serialize: function(input) {
return HTML_AJAX_JSON.stringify(input);
},
unserialize: function(input) {
try {
return eval(input);
} catch(e) {
return HTML_AJAX_JSON.parse(input);
}
}
}
function HTML_AJAX_Serialize_Null() {}
HTML_AJAX_Serialize_Null.prototype = {
contentType: 'text/plain; charset=UTF-8',
serialize: function(input) {
return input;
},
unserialize: function(input) {
return input;
}
}
function HTML_AJAX_Serialize_Error() {}
HTML_AJAX_Serialize_Error.prototype = {
contentType: 'application/error; charset=UTF-8',
serialize: function(input) {
var ser = new HTML_AJAX_Serialize_JSON();
return ser.serialize(input);
},
unserialize: function(input) {
var ser = new HTML_AJAX_Serialize_JSON();
var data = new ser.unserialize(input);
var e = new Error('PHP Error');
for(var i in data) {
e[i] = data[i];
}
throw e;
}
}
function HTML_AJAX_Client_Error(e, code)
{
e.name = 'Client_Error';
e.code = code;
return e;
};
// Dispatcher.js
function HTML_AJAX_Dispatcher(className,mode,callback,serverUrl,serializer,unserializer)
{
this.className = className;
this.mode = mode;
this.callback = callback;
if (serverUrl) {
this.serverUrl = serverUrl
}
else {
this.serverUrl = window.location;
}
if (serializer) {
eval("this.serialize = new HTML_AJAX_Serialize_"+serializer+";");
}
else {
this.serialize = new HTML_AJAX_Serialize_JSON();
}
if (unserializer) {
eval("this.unserialize = new HTML_AJAX_Serialize_"+unserializer+";");
}
else {
this.unserialize = new HTML_AJAX_Serialize_JSON();
}
}
HTML_AJAX_Dispatcher.prototype = {
client: null,
timeout: 20000,
request: false,
contentTypeMap: {'JSON':'application/json','Null':'text/plain','Error':'application/error'},
initClient: function()
{
this.client = new HTML_AJAX_HttpClient();
this.client.dispatcher = this;
},
doCall: function(callName,args)
{
if ( !this.client ) {
this.initClient();
}
if ( !this.request ) {
this.request = new HTML_AJAX_Request(this.serialize);
}
this.request.reset();
this.request.serverurl = this.serverUrl+"?c="+this.className+"&m="+callName;
this.timeout = this.timeout;
for(var i=0; i < args.length; i++) {
this.request.addArg(i,args[i]);
};
if ( this.mode == "async" ) {
return this._asyncCall(this.request,callName);
} else {
return this._syncCall(this.request,callName);
}
},
_asyncCall: function(request, callName)
{
try {
this.client.asyncCall(request,this,callName);
} catch (e) {
this.errorFunc(e);
}
return;
},
_syncCall: function(request, callName)
{
try {
var response = this.client.call(request,callName);
try {
this._setupUnserializer(this.client.xmlhttp.getResponseHeader('Content-Type'));
var data = this.unserialize.unserialize(response);
try {
return data;
} catch (e) {
if ( e.name == 'Server_Error' ) {
this.serverErrorFunc(e);
} else {
this.applicationErrorFunc(e);
}
}
} catch (e) {
e.name = 'Server_Error';
e.code = 2006;
e.response = response;
this.errorFunc(e);
}
} catch(e) {
this.errorFunc(e);
}
},
_setupUnserializer: function(contentType) {
for(var i in this.contentTypeMap) {
if (contentType == this.contentTypeMap[i]) {
eval("this.unserialize = new HTML_AJAX_Serialize_"+i+";");
return true;
}
}
return false;
},
onLoad: function(response, callName, contentType)
{
try {
this._setupUnserializer(contentType);
var data = this.unserialize.unserialize(response);
try {
if ( this.callback[callName] ) {
try {
this.callback[callName](data);
} catch(e) {
this.errorFunc(e);
}
} else {
alert('Your handler must define a method '+callName);
}
} catch (e) {
e.client = this.className;
e.call = callName;
var errorFunc = callName+'Error';
if ( this.callback[errorFunc] ) {
try {
this.callback[errorFunc](e);
} catch(e) {
this.errorFunc(e);
}
} else {
this.errorFunc(e);
}
}
} catch (e) {
e.name = 'Server_Error';
e.code = 2006;
e.response = response;
e.client = this.className;
e.call = callName;
this.errorFunc(e);
}
},
errorFunc: function(e) {
if (HTML_AJAX.onError) {
HTML_AJAX.onError(e);
}
else {
throw(e);
}
}
};
// HttpClient.js
function HTML_AJAX_HttpClient() {}
HTML_AJAX_HttpClient.prototype = {
xmlhttp: null,
userhandler: null,
_timeout_id: null,
init: function()
{
try {
this.xmlhttp = new XMLHttpRequest();
} catch (e) {
var MSXML_XMLHTTP_PROGIDS = new Array(
'MSXML2.XMLHTTP.5.0',
'MSXML2.XMLHTTP.4.0',
'MSXML2.XMLHTTP.3.0',
'MSXML2.XMLHTTP',
'Microsoft.XMLHTTP'
);
var success = false;
for (var i=0;i < MSXML_XMLHTTP_PROGIDS.length && !success; i++) {
try {
this.xmlhttp = new ActiveXObject(MSXML_XMLHTTP_PROGIDS[i]);
success = true;
} catch (e) {}
}
if ( !success ) {
throw HTML_AJAX_Client_Error(
new Error('Unable to create XMLHttpRequest.'),
1000
);
}
}
},
call: function (request,callName)
{
if ( !this.xmlhttp ) {
this.init();
}
if (this.callInProgress()) {
throw HTML_AJAX_Client_Error(
new Error('Call in progress'),
1001
);
};
if (HTML_AJAX.onOpen) {
HTML_AJAX.onOpen(this.dispatcher.className,callName);
}
request.type = 'sync';
request.prepare(this.xmlhttp);
this.xmlhttp.setRequestHeader('Accept-Charset','UTF-8');
request.send();
if ( this.xmlhttp.status == 200 ) {
if (HTML_AJAX.onLoad) {
HTML_AJAX.onLoad(this.dispatcher.className,callName);
}
return this.xmlhttp.responseText;
} else {
var errorMsg = '['+this.xmlhttp.status
+'] '+this.xmlhttp.statusText;
var err = new Error(errorMsg);
err.headers = this.xmlhttp.getAllResponseHeaders();
throw HTML_AJAX_Client_Error(err,1002);
}
},
asyncCall: function (request,handler)
{
var callName = null;
if ( arguments[2] ) {
callName = arguments[2];
}
if ( !this.xmlhttp ) {
this.init();
}
if (this.callInProgress()) {
throw HTML_AJAX_Client_Error(
new Error('Call in progress'),
1001
);
};
this.userhandler = handler;
request.type = 'async';
request.prepare(this.xmlhttp);
this.xmlhttp.setRequestHeader('Accept-Charset','UTF-8');
var self = this;
this._timeout_id = window.setTimeout(function() {
self.abort(self, callName);
},request.timeout);
this.xmlhttp.onreadystatechange = function() {
self._stateChangeCallback(self, callName);
}
request.send();
},
callInProgress: function()
{
switch ( this.xmlhttp.readyState ) {
case 1:
case 2:
case 3:
return true;
break;
default:
return false;
break;
}
},
abort: function (client, callName)
{
if ( client.callInProgress() ) {
client.xmlhttp.abort();
var errorMsg = 'Operation timed out';
if ( callName ) {
errorMsg += ': '+callName;
}
if ( HTML_AJAX.onError ) {
HTML_AJAX.onError(HTML_AJAX_Client_Error(new Error(errorMsg), 1003));
}
}
},
_stateChangeCallback: function(client, callName)
{
switch (client.xmlhttp.readyState) {
case 1:
if(HTML_AJAX.onOpen) {
HTML_AJAX.onOpen(this.dispatcher.className, callName);
}
break;
case 2:
if (HTML_AJAX.onSend ) {
HTML_AJAX.onSend(this.dispatcher.className, callName);
}
break;
case 3:
if (HTML_AJAX.onProgress ) {
HTML_AJAX.onProgress(this.dispatcher.className, callName);
}
break;
case 4:
window.clearTimeout(client._timeout_id);
switch ( client.xmlhttp.status ) {
case 200:
if (HTML_AJAX.onLoad) {
HTML_AJAX.onLoad(this.dispatcher.className, callName);
}
if (client.userhandler.onLoad ) {
try {
client.userhandler.onLoad(client.xmlhttp.responseText, callName, this.xmlhttp.getResponseHeader('Content-Type'));
} catch (e) {
if (HTML_AJAX.onError) {
HTML_AJAX.onError(e);
}
else {
throw e;
}
}
}
break;
case 0:
break;
default:
var e = new HTML_AJAX_Client_Error(
new Error('Error in Response, HTTP Error: ['+client.xmlhttp.status+'] '+ client.xmlhttp.statusText),
1002
);
e.headers = this.xmlhttp.getAllResponseHeaders();
if (HTML_AJAX.onError) {
HTML_AJAX.onError(e);
}
else {
throw e;
}
break;
}
break;
}
}
}
// Request.js
function HTML_AJAX_Request(serializer) {
this.serializer = serializer;
}
HTML_AJAX_Request.prototype = {
serializer: null,
serverurl: '',
requesturl: '',
body: '',
args: null,
type: null,
http: null,
timeout: 20000,
addArg: function(name, value)
{
if ( !this.args ) {
this.args = [];
}
var illegal = /[\W_]/;
if (!illegal.test(name) ) {
this.args[name] = value;
} else {
throw HTML_AJAX_Client_Error(
new Error('Invalid parameter name ('+name+')'),
1004
);
}
},
reset: function()
{
this.serverurl = '';
this.requesturl = '';
this.body = '';
this.args = null;
this.type = null;
this.http = null;
this.timeout = 20000;
},
build: function()
{
try {
this.body = this.serializer.serialize(this.args);
} catch (e) {
throw HTML_AJAX_Client_Error(e, 1006);
};
this.requesturl = this.serverurl;
},
prepare: function(http)
{
this.http = http;
this.build();
switch ( this.type ) {
case 'async':
try {
this.http.open('POST',this.requesturl,true);
} catch (e) {
throw HTML_AJAX_Client_Error(new Error(e),1007);
};
break;
case 'sync':
try {
this.http.open('POST',this.requesturl,false);
} catch (e) {
throw HTML_AJAX_Client_Error(new Error(e),1007);
};
break;
default:
throw HTML_AJAX_Client_Error(
new Error('Call type invalid '+this.type),
1005
);
break;
};
if (this.body) {
this.http.setRequestHeader('Content-Length', this.body.length);
}
this.http.setRequestHeader('Content-Type',this.serializer.contentType);
},
send: function(http)
{
this.http.send(this.body);
}
};
// JSON.js
Array.prototype.______array = '______array';
var HTML_AJAX_JSON = {
org: 'http://www.JSON.org',
copyright: '(c)2005 JSON.org',
license: 'http://www.crockford.com/JSON/license.html',
stringify: function (arg) {
var c, i, l, s = '', v;
switch (typeof arg) {
case 'object':
if (arg) {
if (arg.______array == '______array') {
for (i = 0; i < arg.length; ++i) {
v = this.stringify(arg[i]);
if (s) {
s += ',';
}
s += v;
}
return '[' + s + ']';
} else if (typeof arg.toString != 'undefined') {
for (i in arg) {
v = arg[i];
if (typeof v != 'undefined' && typeof v != 'function') {
v = this.stringify(v);
if (s) {
s += ',';
}
s += this.stringify(i) + ':' + v;
}
}
return '{' + s + '}';
}
}
return 'null';
case 'number':
return isFinite(arg) ? String(arg) : 'null';
case 'string':
l = arg.length;
s = '"';
for (i = 0; i < l; i += 1) {
c = arg.charAt(i);
if (c >= ' ') {
if (c == '\\' || c == '"') {
s += '\\';
}
s += c;
} else {
switch (c) {
case '\b':
s += '\\b';
break;
case '\f':
s += '\\f';
break;
case '\n':
s += '\\n';
break;
case '\r':
s += '\\r';
break;
case '\t':
s += '\\t';
break;
default:
c = c.charCodeAt();
s += '\\u00' + Math.floor(c / 16).toString(16) +
(c % 16).toString(16);
}
}
}
return s + '"';
case 'boolean':
return String(arg);
default:
return 'null';
}
},
parse: function (text) {
var at = 0;
var ch = ' ';
function error(m) {
throw {
name: 'JSONError',
message: m,
at: at - 1,
text: text
};
}
function next() {
ch = text.charAt(at);
at += 1;
return ch;
}
function white() {
while (ch) {
if (ch <= ' ') {
next();
} else if (ch == '/') {
switch (next()) {
case '/':
while (next() && ch != '\n' && ch != '\r') {}
break;
case '*':
next();
for (;;) {
if (ch) {
if (ch == '*') {
if (next() == '/') {
next();
break;
}
} else {
next();
}
} else {
error("Unterminated comment");
}
}
break;
default:
error("Syntax error");
}
} else {
break;
}
}
}
function string() {
var i, s = '', t, u;
if (ch == '"') {
outer:          while (next()) {
if (ch == '"') {
next();
return s;
} else if (ch == '\\') {
switch (next()) {
case 'b':
s += '\b';
break;
case 'f':
s += '\f';
break;
case 'n':
s += '\n';
break;
case 'r':
s += '\r';
break;
case 't':
s += '\t';
break;
case 'u':
u = 0;
for (i = 0; i < 4; i += 1) {
t = parseInt(next(), 16);
if (!isFinite(t)) {
break outer;
}
u = u * 16 + t;
}
s += String.fromCharCode(u);
break;
default:
s += ch;
}
} else {
s += ch;
}
}
}
error("Bad string");
}
function array() {
var a = [];
if (ch == '[') {
next();
white();
if (ch == ']') {
next();
return a;
}
while (ch) {
a.push(value());
white();
if (ch == ']') {
next();
return a;
} else if (ch != ',') {
break;
}
next();
white();
}
}
error("Bad array");
}
function object() {
var k, o = {};
if (ch == '{') {
next();
white();
if (ch == '}') {
next();
return o;
}
while (ch) {
k = string();
white();
if (ch != ':') {
break;
}
next();
o[k] = value();
white();
if (ch == '}') {
next();
return o;
} else if (ch != ',') {
break;
}
next();
white();
}
}
error("Bad object");
}
function number() {
var n = '', v;
if (ch == '-') {
n = '-';
next();
}
while (ch >= '0' && ch <= '9') {
n += ch;
next();
}
if (ch == '.') {
n += '.';
while (next() && ch >= '0' && ch <= '9') {
n += ch;
}
}
if (ch == 'e' || ch == 'E') {
n += 'e';
next();
if (ch == '-' || ch == '+') {
n += ch;
next();
}
while (ch >= '0' && ch <= '9') {
n += ch;
next();
}
}
v = +n;
if (!isFinite(v)) {
} else {
return v;
}
}
function word() {
switch (ch) {
case 't':
if (next() == 'r' && next() == 'u' && next() == 'e') {
next();
return true;
}
break;
case 'f':
if (next() == 'a' && next() == 'l' && next() == 's' &&
next() == 'e') {
next();
return false;
}
break;
case 'n':
if (next() == 'u' && next() == 'l' && next() == 'l') {
next();
return null;
}
break;
}
error("Syntax error");
}
function value() {
white();
switch (ch) {
case '{':
return object();
case '[':
return array();
case '"':
return string();
case '-':
return number();
default:
return ch >= '0' && ch <= '9' ? number() : word();
}
}
return value();
}
};
