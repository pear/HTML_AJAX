<script type="text/javascript" src="serialize.js"></script>
<script type="text/javascript">

function describe(inp)
{
    var type = gettype(inp);
    var ctype;
    var out = "Type: " + type + "\nContents: ";
    switch (type) {
        case "string":
        case "number":
            out += inp;
            break;
        case "boolean":
            out += (inp ? 'true' : 'false');
            break;
        case "array":
        case "object":
            for (k in inp) {
                out += k + " => ";
                ctype = gettype(inp[k]);
                out += (ctype == "array" || ctype == "object" ? describe(inp[k]) : inp[k]) + "\n";
            }
    }
    return out;
}

unserializer = new Unserializer;

</script>
<?php

$examples = array(
    '$foo = null;',
    '$foo = true;',
    '$foo = "foobar";',
    '$foo = 337;',
    '$foo = 99.99;',
    '$foo = array("a" => 1, "b" => 2, 3);',
    '$foo = array(1,2,array(1,2,3));',
    'class Foo { var $foo; var $bar; }' 
    . '$foo = new Foo; $foo->foo = "hello"; $foo->bar = array("world","universe");'
);

echo '<h1><a name="pos">Positives</a> | <a href="#neg">Negatives</a></h1>';
$c = count($examples);
for ($i = 0; $i < $c; $i++) {
    echo "<strong>PHP Code:</strong>\n<pre>$examples[$i]</pre>\n<strong>PHP value:</strong><pre>\n";
    eval($examples[$i]);
    var_dump($foo);
    $sfoo = serialize($foo);
    echo "</pre>\n<strong>Serialized in PHP:</strong>\n<pre>", $sfoo, "</pre>\n",
         "<strong>Unserialized in JS:</strong>\n<pre>\n",
         '<script type="text/javascript">',
         'var sfoo = unescape("', urlencode($sfoo), '"); var usfoo = unserializer.unserialize(sfoo); if (unserializer.error) {',
         'document.write("Error: " + unserializer.getError() + "\n"); } document.write(describe(usfoo) + ',
         '"</pre>\n<strong>Serialized in JS:</strong>\n<pre>" + serialize(usfoo));', "</script>\n</pre>\n<hr />\n\n";
}

$bad_examples = array(
    'x',
    'x:1',
    'N',
    'Nx',
    'b:f;',
    'b:1',
    'i:foo;',
    'i:1',
    'd:foo;',
    'd:1.1.1;',
    'd:1.1',
    's:6:"foo";',
    's:6:"foofoo"',
    's:1:"foo";',   
    's:0:""',
    'a:3:{s:1:"aa";i:1;s:1:"b";i:2;i:0;i:3;}',
    'a:4:{s:1:"a";i:1;s:1:"b";i:2;i:0;i:3;',
    'a:3:{i:1;s:1:"b";i:2;i:0;i:3;}',
    'a:3:{}',
    'O:3:"Fooo":2:{s:3:"foo";s:5:"hello";s:3:"bar";a:2:{i:0;s:5:"world";i:1;s:8:"universe";}}',
    'O:3:"Foo":3:{s:3:"foo";s:5:"hello";s:3:"bar";a:2:{i:0;s:5:"world";i:1;s:8:"universe";}}',
    'O:3:"Foo":2:{s:5:"hello";s:3:"bar";a:2:{i:0;s:5:"world";i:1;s:8:"universe";}}',
    'O:3:"Foo":2:{s:3:"foo";s:5:"hello";s:3:"bar";a:2:{i:0;s:5:"world";i:1;s:8:"universe";}',
    'O:3:"Foo":2:{s:3:"foo";s:5:"hello";s:3:"bar";a:2:{i:0;s:5:"world";i:1;s:8:"universe"}}'
);

echo '<h1><a href="#pos">Positives</a> | <a name="neg">Negatives</a></h1>';
foreach ($bad_examples as $sfoo) {
    echo "</pre>\n<strong>Invalidly serialized:</strong>\n<pre>", $sfoo, "</pre>\n",
         "<strong>Unserialized in JS:</strong>\n<pre>\n",
         '<script type="text/javascript">',
         'var sfoo = unescape("', urlencode($sfoo), '"); var usfoo = unserializer.unserialize(sfoo); if (unserializer.error) {',
         'document.write("Error: " + unserializer.getError() + "\n"); } document.write(describe(usfoo));',
         "</script>\n</pre>\n<hr />\n\n";
}


?>
