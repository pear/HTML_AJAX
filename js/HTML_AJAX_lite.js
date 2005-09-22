// Main.js
var HTML_AJAX = {
defaultServerUrl: false,
defaultEncoding: 'Null',
httpClient: function() {
return new HTML_AJAX_HttpClient();
},
makeRequest: function(request) {
var client = HTML_AJAX.httpClient();
client.request = request;
return client.makeRequest();
},
serializerForEncoding: function(encoding) {
for(var i in HTML_AJAX.contentTypeMap) {
if (encoding == HTML_AJAX.contentTypeMap[i] || encoding == i) {
return eval("new HTML_AJAX_Serialize_"+i+";");
}
}
return new HTML_AJAX_Serialize_Null();
},
fullcall: function(url,encoding,className,method,callback,args) {
var serializer = HTML_AJAX.serializerForEncoding(encoding);
var request = new HTML_AJAX_Request(serializer);
if (callback) {
request.isAsync = true;
}
request.requestUrl = url;
request.className = className;
request.methodName = method;
request.callback = callback;
request.args = args;
return HTML_AJAX.makeRequest(request);
},
call: function(className,method,callback) {
var args = new Array();
for(var i = 3; i < arguments.length; i++) {
args.push(arguments[i]);
}
return HTML_AJAX.fullcall(HTML_AJAX.defaultServerUrl,HTML_AJAX.defaultEncoding,className,method,callback,args);
},
grab: function(url,callback) {
return HTML_AJAX.fullcall(url,'Null',false,null,callback,{});
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
},
contentTypeMap: {'JSON':'application/json','Null':'text/plain','Error':'application/error'}
}
function HTML_AJAX_Serialize_Null() {}
HTML_AJAX_Serialize_Null.prototype = {
contentType: 'text/plain; charset=UTF-8;',
serialize: function(input) {
return new String(input).valueOf();
},
unserialize: function(input) {
return new String(input).valueOf();
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
function HTML_AJAX_Serialize_Urlencoded() {}
HTML_AJAX_Serialize_Urlencoded.prototype = {
contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
serialize: function(input) {
var newURL  = '';
for (var i in input) {
input[i] = escape(input[i]);
newURL = newURL + i + '=' + input[i] + '&';
}
newURL = encodeURI(newURL.substr(0, (newURL.length-1)));
return newURL;
},
unserialize: function(input) {
var newURL  = '';
for (var i in input) {
input[i] = escape(input[i]);
newURL = newURL + i + '=' + input[i] + '&';
}
newURL = decodeURI(newURL.substr(0, (newURL.length-1)));
return newURL;
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
// Dispatcher.js
function HTML_AJAX_Dispatcher(className,mode,callback,serverUrl,serializerType)
{
this.className = className;
this.mode = mode;
this.callback = callback;
this.serializerType = serializerType;
if (serverUrl) {
this.serverUrl = serverUrl
}
else {
this.serverUrl = window.location;
}
}
HTML_AJAX_Dispatcher.prototype = {
timeout: 20000,
doCall: function(callName,args)
{
var request = new HTML_AJAX_Request();
request.requestUrl = this.serverUrl;
request.className = this.className;
request.methodName = callName;
request.timeout = this.timeout;
request.contentType = this.contentType;
request.serializer = eval('new HTML_AJAX_Serialize_'+this.serializerType);
for(var i=0; i < args.length; i++) {
request.addArg(i,args[i]);
};
if ( this.mode == "async" ) {
request.isAsync = true;
} else {
request.isAsync = false;
}
var self = this;
request.callback = function(result) { self.callback[callName](result); }
return HTML_AJAX.makeRequest(request);
}
};
// HttpClient.js
function HTML_AJAX_HttpClient() { }
HTML_AJAX_HttpClient.prototype = {
request: null,
_timeoutId: null,
init:function()
{
try {
this.xmlhttp = new XMLHttpRequest();
} catch (e) {
var XMLHTTP_IDS = new Array(
'MSXML2.XMLHTTP.5.0',
'MSXML2.XMLHTTP.4.0',
'MSXML2.XMLHTTP.3.0',
'MSXML2.XMLHTTP',
'Microsoft.XMLHTTP' );
var success = false;
for (var i=0;i < XMLHTTP_IDS.length && !success; i++) {
try {
this.xmlhttp = new ActiveXObject(XMLHTTP_IDS[i]);
success = true;
} catch (e) {}
}
if (!success) {
throw new Error('Unable to create XMLHttpRequest.');
}
}
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
makeRequest: function()
{
if (!this.xmlhttp) {
this.init();
}
try {
this.xmlhttp.open(this.request.requestType,this.request.completeUrl(),this.request.isAsync);
var self = this;
this.xmlhttp.onreadystatechange = function() { self._readyStateChangeCallback(); }
this.xmlhttp.setRequestHeader('Content-Type',this.request.getContentType());
var payload = this.request.getSerializedPayload();
if (payload) {
this.xmlhttp.setRequestHeader('Content-Length', payload.length);
}
this.xmlhttp.send(payload);
} catch (e) {
this._handleError(e);
}
if (!this.request.isAsync) {
if ( this.xmlhttp.status == 200 ) {
if (this.request.onLoad) {
this.request.onLoad();
} else if (HTML_AJAX.onLoad) {
HTML_AJAX.onLoad(this.request);
}
return this._decodeResponse();
} else {
var e = new Error('['+this.xmlhttp.status +'] '+this.xmlhttp.statusText);
e.headers = this.xmlhttp.getAllResponseHeaders();
this._handleError(e);
}
}
else {
var self = this;
this._timeoutId = window.setTimeout(function() { self.abort(true); },this.request.timeout);
}
},
abort: function (automatic)
{
if (this.callInProgress()) {
this.xmlhttp.abort();
if (automatic) {
this._handleError(new Error('Request Timed Out'));
}
}
},
_readyStateChangeCallback:function()
{
switch(this.xmlhttp.readyState) {
case 1:
break;
case 2:
if (this.request.onSend) {
this.request.onSend();
} else if (HTML_AJAX.onSend) {
HTML_AJAX.onSend(this.request);
}
break;
case 3:
if (this.request.onProgress) {
this.request.onProgress();
} else if (HTML_AJAX.onProgress ) {
HTML_AJAX.onProgress(this.request);
}
break;
case 4:
window.clearTimeout(this._timeout_id);
if (this.xmlhttp.status == 200) {
if (this.request.onLoad) {
this.request.onLoad();
} else if (HTML_AJAX.onLoad ) {
HTML_AJAX.onLoad(this.request);
}
this.request.callback(this._decodeResponse());
}
else {
var e = new Error('HTTP Error Making Request: ['+this.xmlhttp.status+'] '+this.xmlhttp.statusText);
this._handleError(e);
}
break;
}
},
_decodeResponse: function() {
var unserializer = HTML_AJAX.serializerForEncoding(this.xmlhttp.getResponseHeader('Content-Type'));
return unserializer.unserialize(this.xmlhttp.responseText);
},
_handleError: function(e)
{
if (this.request.onError) {
this.request.onError(e);
} else if (HTML_AJAX.onError) {
HTML_AJAX.onError(e,this.request);
}
else {
throw e;
}
}
}
// Request.js
function HTML_AJAX_Request(serializer) {
this.serializer = serializer;
}
HTML_AJAX_Request.prototype = {
serializer: null,
isAsync: false,
requestType: 'POST',
requestUrl: '',
className: null,
methodName: null,
timeout: 20000,
args: null,
callback: null,
addArg: function(name, value)
{
if ( !this.args ) {
this.args = [];
}
if (!/[^a-zA-Z_0-9]/.test(name) ) {
this.args[name] = value;
} else {
throw new Error('Invalid parameter name ('+name+')');
}
},
getSerializedPayload: function() {
return this.serializer.serialize(this.args);
},
getContentType: function() {
return this.serializer.contentType;
},
completeUrl: function() {
var url = this.requestUrl;
if (this.className || this.methodName) {
url += '?c='+escape(this.className)+'&m='+escape(this.methodName);
}
return url;
}
}
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
