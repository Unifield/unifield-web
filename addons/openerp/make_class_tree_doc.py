
import pyclbr
from graphviz import Digraph

def classes_in_module(modulename):

    module = pyclbr.readmodule(modulename)
    classes = set()
    for elem in module.values():
        classes.add(elem)
        for mother_class in rec_mother_classes(elem):
            classes.add(mother_class)

    return classes

def classname(c):
    name = c if isinstance(c, basestring) else c.name
    # Quick and dirty hack to have a prefix for classes inside widgets/form/ ...
    if not isinstance(c, basestring):
        if "addons/openerp/widgets/form" in c.file:
            name = "(form) "+name
        if "addons/openerp/widgets/listgrid" in c.file:
            name = "(listgrid) "+name
    return name

def mother_classes(c):
    return [] if isinstance(c, basestring) else c.super

def rec_mother_classes(elem):
    if isinstance(elem, basestring):
        return []
    else:
        classes = []
        for mclass in elem.super:
            classes.append(mclass)
            classes.extend(rec_mother_classes(mclass))
        return classes

def render_graph(classes):
    dot = Digraph(engine="fdp", comment='Class Hierarchy')
    for c in classes:
        name = classname(c)
        parents = [ classname(c) for c in mother_classes(c) ]

        for parent in parents:
            dot.edge(name, parent)

    dot.render("./class-hierarchy.gv", view=True)

###############################################################################

all_classes = set() \
              .union(classes_in_module("widgets")) \
              .union(classes_in_module("widgets.screen")) \
              .union(classes_in_module("widgets.listgrid")) \
              .union(classes_in_module("widgets.form"))

render_graph(all_classes)

