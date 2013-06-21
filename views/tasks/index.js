'use strict';

require('templates/tasks')

module.exports = A.View.extend({
  template: A.Templates['tasks/index']
  , el: A.$container
  , events: {
    'keydown': 'keyboardCommand'
  }
  , views: {
    'tasks/taskList': {el: '#tasks'}
  }
  , initialize: function(){
    document.onkeyup = this.keyboardCommand.bind(this)
  }
  , keyboardCommand: function(e){
    switch (e.keyCode) {
      case 74: //j
        console.log('down')
        break
      case 75: //k
        console.log('up')
        break
      case 32: //space
        console.log('done')
        break
      case 13: //enter
        console.log('edit')
        break
      case 9: //tab
        console.log('tab')
        break
    }
    console.log(e.keyCode)
  }
})
