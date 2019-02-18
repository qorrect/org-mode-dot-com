# Common Scenarios 


###Get line text 

###Delete Line Text 
    

###Save File

        save_buffer_with_contiunation
        save_file_to_file_list
        org_save_buffer

###Open Buffer

        ymacs.createOrOpen(name.trim());

###Folding
Have to come back to this one, currently they are done with markers in org_mode, need to do this in JS mode then pull out the commonalities 
### Switching Modes

For new files based on extension buffer.maybeSetMode()
Otherwise just execute 

        `cmd.buffer('org_mode')`
       
## Set Width of things

    DlWidget.setSize({x, y})
    DlWidget.setPos (x, y)


## Events 

    ymacs.registerEvents(["event_name"] );
    ymacs.addEventListener("event_name", (arg1,arg2) => console.log(arg1,arg2) );
    ymacs.callHooks('event_name',1,2);