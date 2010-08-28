# node² by ChAoTiC UnIcOrNs

## TODO

* Homepage (+ bubble creation)
* ...
* user documentation

## Naming Conventions

bubble: a set of mindmaps; identified by an id

## Protocol

### Conventions

#### node-id

tree-path ([1,0,4])

#### method-invocation

    {$method_name: {$arg1: a, $arg2: b, ...}}

### Methods

    # user management
    register(name, color) => $root_node or null
    change_name(name) => bool
    change_color(color) => bool
    user_list() => [{name: '', color: ''}, ...]

    # changing tree structure
    add_node(content, to) => bool
    move_node(id, to) => bool
    delete_node(id) => bool

    # changing properties
    change_position(id, $DODO_FRAGEN) => bool
    edit_content(id, content) => bool

### Signals

    # user management
    registered(name, color)
    left(name)
    name_changed(old, new)
    color_changed(name, color)

    # changing tree structure
    node_added(content, to)
    node_moved(id, to)
    node_deleted(id)

    # changing properties
    position_changed(id, $DODO_FRAGEN)
    content_edited(id, content)

## Data Structure

### node

    {
        content: '',
        subs: [$node, ...],
    }

### bubble

node with

    {
        content: 'bubble name',
        subs: [$mindmap_node, ...],
        users: [{name: '', color: ''}, ...],
    }

### mindmap

node with

    {
        content: 'mindmap name',
        subs: [$node, ...],
    }
