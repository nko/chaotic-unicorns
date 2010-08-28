# node² by ChAoTiC UnIcOrNs

## TODO

* Homepage (+ bubble creation)
* ...
* user documentation
* "catch attention" with blinking nodes

frontend

* nodes positionierung
* nodes moven
* ...

backend

* ...

jan

* koord system bauen

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
    register(bubble_id, name, color)
    change_name(name)
    change_color(color)

    # changing tree structure
    add_node(content, to)
    move_node(id, to)
    delete_node(id)

    # changing properties
    change_position(id, $DODO_FRAGEN)
    edit_content(id, content)

    # bubble management
    create_bubble(name)

### Signals

#### Personal Messages

    # error message
    error(msg)

    # after registering
    node_data(bubble)

    # bubble creation
    bubble_created(id)

#### Broadcasts

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
        id: 'hash',
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
