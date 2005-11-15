/**
 * HTML_AJAX_Serialize_HA  - custom serialization
 *
 * This class is used with the JSON serializer and the HTML_AJAX_Action php class
 * to allow users to easily write data handling and dom manipulation related to
 * ajax actions directly from their php code
 *
 * See Main.js for Author/license details
 */
function HTML_AJAX_Serialize_HA() {}
HTML_AJAX_Serialize_HA.prototype = {
    /**
     *  Takes data from JSON - which should be parseable into a nice array
     *  reads the action to take and pipes it to the right method
     *
     *  @param    string payload incoming data from php
     *  @return   true on success, false on failure
     */
    unserialize: function(payload)
    {
        var actions = eval(payload);
        for(var i = 0; i < actions.length; i++)
        {
            switch(i.action)
            {
                case 'prepend':
                    HTML_AJAX_Serialize_HA._prependAttr(i.id, i.attribute, i.data);
                    break;
                case 'append':
                    HTML_AJAX_Serialize_HA._appendAttr(i.id, i.attribute, i.data);
                    break;
                case 'assign':
                    HTML_AJAX_Serialize_HA._assignAttr(i.id, i.attribute, i.data);
                    break;
                case 'clear':
                    HTML_AJAX_Serialize_HA._clearAttr(i.id, i.attribute);
                    break;
                case 'create':
                    HTML_AJAX_Serialize_HA._createNode(i.id, i.tag, i.attribute, i.type);
                    break;
                case 'replace':
                    HTML_AJAX_Serialize_HA._removeAttr(i.id, i.tag, i.attribute);
                    break;
                case 'remove':
                    HTML_AJAX_Serialize_HA._removeAttr(i.id);
                    break;
                case 'script':
                    HTML_AJAX_Serialize_HA._insertScript(i.data);
                    break;
                case 'alert':
                    HTML_AJAX_Serialize_HA._insertAttr(i.data);
                    break;
            }
        }
    }
	_prependAttr: function(id, attribute, data)
	{
		var node = document.getElementById(id);
        for (var i in attribute)
        {
            if node.hasAttribute(i)
            {
                node.setAttribute(i, attribute[i] + node.i);
            }
        }
	}
	_appendAttr: function(id, attribute, data)
	{
		var node = document.getElementById(id);
        for (var i in attribute)
        {
            if node.hasAttribute(i)
            {
                node.setAttribute(i, node.i + attribute[i]);
            }
        }
	}
	_assignAttr: function(id, attribute, data)
	{
		var node = document.getElementById(id);
        for (var i in attribute)
        {
            node.setAttribute(i, attribute[i]);
        }
	}
	_clearAttr: function(id, attribute)
	{
		var node = document.getElementById(id);
        for(var i = 0; i < attribute.length; i++)
        {
            node.removeAttribute(i);
        }
	}
    _createNode(id, tag, attribute, type);
    {
        var newnode = document.createElement(tag);
		for (var i in attribute)
        {
            newnode.setAttribute(i, attribute[i]);
        }
        switch(type)
        {
            case 'append':
                var parent = document.getElementById(id).parentNode;
                document.parent.appendChild(newnode);
                break
            case 'prepend':
                var sibling = ;
                var parent = sibling.parentNode;
                parent.insertBefore(newnode, sibling);
                break;
            case 'insert':
                var sibling = document.getElementById(id);
                var parent = sibling.parentNode;
                parent.insertBefore(newnode, sibling);
                break;
        }
		var node = document.getElementById(id);
		var parent = node.parentNode;
        var newnode = document.createElement(tag);
		for (var i in attribute)
        {
            newnode.setAttribute(i, attribute[i]);
        }
        parent.replaceChild(newnode, node);
	}
    _replaceNode: function(id, tag, attribute)
    {
		var node = document.getElementById(id);
		var parent = node.parentNode;
        var newnode = document.createElement(tag);
		for (var i in attribute)
        {
            newnode.setAttribute(i, attribute[i]);
        }
        parent.replaceChild(newnode, node);
	}
    }
	_removeNode: function(id)
	{
		var node = document.getElementById(id);
		var parent = node.parentNode;
		parent.removeChild(node);
	}
    _insertScript(data)
    {
        eval(data);
    }
    _insertAlert: function(data)
    {
        alert(data);
    }
}

