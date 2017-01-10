

var isInXPathHelp = false;
var inTaskXpath = false; //used for load a specific form reloading the tree
var xPathHelp = "/";
var taskActions = ["editTask", "addTaskInput", "editTaskInput"];

String.prototype.xpathParent = function (repeat) {
	var parts = this.split('/');
	if (typeof(repeat)=='undefined')
		repeat = 1;

	for (var i=0; i<repeat; i++)
		parts.pop();  // remove last part of the xpath expression

	return parts.join('/');
}


// Perform actions according to the values of previousAction and previousXPath
/*$(document).ready( function () {
	var previousAction = sessionStorage.getItem('previousAction');
	var previousXPath = sessionStorage.getItem('previousXPath');
	sessionStorage.clear();

	if (typeof(previousAction) == 'undefined' || typeof(previousXPath) == 'undefined')
		return;

	switch (previousAction) {
		case 'deleteTaskInput':
		case 'editTaskInput':
			var taskXPath = previousXPath.xpathParent();
			var taskDiv = $('#workflow div[ data-xpath = "'+taskXPath+'" ]')
			taskDiv.find('img.editTaskInputs').click();
			break;

		case 'addTaskInput':
			var taskDiv = $('#workflow div[ data-xpath = "'+previousXPath+'" ]')
			taskDiv.find('img.editTaskInputs').click();
			break;
	}
});*/

$(document).on("click", "#toggleXML", function(){
	$('#workflow_xml').toggle();
});

function executeAction (action, clicked, confirmed) {
	if (isInXPathHelp) return;

	var item = $();
	var loc = '';
	confirmed = typeof(confirmed)!='undefined' ? confirmed : false;

	if (typeof(clicked) != 'undefined') {
		item = clicked;
		if (typeof(item.data('xpath')) != 'undefined')
			loc = item.data('xpath');
	}

	if(taskActions.indexOf(action) == -1){
		inTaskXpath = false;
	}

	sessionStorage.setItem('previousAction',action);
	sessionStorage.setItem('previousXPath',loc);

	workflow_name = document.getElementById('workflow_name').value;
	workflow_group = document.getElementById('workflow_group').value;
	workflow_comment = document.getElementById('workflow_comment').value;

	$.ajax({
		url: 'ajax/edit-session-workflow.php',
		type: 'POST',
		data: 'action='+action+'&location='+loc+'&'+item.serialize()+(confirmed ? '&confirmed=true' : '')+'&workflow_name='+workflow_name+'&workflow_group='+workflow_group+'&workflow_comment='+workflow_comment+'&xml='+$('#workflow_xml').val()+"&id="+getId(),
		success: function (res) {
			/*res = $.parseJSON(res);

			switch (res.type) {
				case 'ok':
					$('p#statusBar').css({color: 'green'}).html('Action succeeded: '+action);
					window.location.reload();
					break;

				case 'ok-redirect':
					$('p#statusBar').css({color: 'green'}).html('Action succeeded: '+action);
					window.location.href = res.msg;
					break;

				case 'confirm':
					if (confirm(res.msg))
						executeAction(action, clicked, true);
					break;

				default:
					$('p#statusBar').css({color: 'red'}).html('Action failed: '+action+' ('+res.msg+')');
			}*/
			updateTree();
			updateXML();
		}
	});
	return false;
}

function editJob (clicked) {
	if (isInXPathHelp === false) {
		xPathHelp = $(clicked).data('xpath').xpathParent(2);
		$('#formContainer').html('');
		$(clicked).parent().parent().parent().find(' > .editJob').clone().appendTo('#formContainer').show();
		location.hash = "#formContainer";
	}
}

function editTask(element) {
	if (isInXPathHelp === false) {
		inTaskXpath = ".lightTreeTask[data-xpath='"+$(element).parent().data('xpath')+"'] > div";
		xPathHelp = $(element).parent().data('xpath').xpathParent(4);
		$('#formContainer').html('');
		$(element).parent().find('.editTask').clone().appendTo('#formContainer').show();
		location.hash = "#formContainer";
	}
}

function editTaskInputs (clicked) {
	if (isInXPathHelp) return;

	var thisTasksInputs = clicked.parents('div.task:eq(0)').find('.taskInputs');
	$('.taskInputs').not(thisTasksInputs).hide();
	thisTasksInputs.toggle();
}


function editTaskInput (clicked) {
	if (isInXPathHelp) return;

	var input = clicked.parents('li.taskInput:eq(0)');

	// input type (input/stdin)
	$('form#editTaskInput input[name=type]').val(input.data('type'));

	if (input.find('.taskInputName').is('.taskInputNameSTDIN')) {  // stdin: name can't be changed, disable input
		$('form#editTaskInput input[name=name]').attr('disabled', true).val('STDIN');
		$('form#editTaskInput select[name=mode]').show().find('option[value='+input.data('mode')+']').attr('selected','selected');
		$('form#editTaskInput select[name=mode]').change();  // trigger event to show hint
	} else {
		$('form#editTaskInput input[name=name]').attr('disabled', false).val(input.data('name'));
		$('form#editTaskInput tr.stdinMode').hide().find('option').removeAttr('selected');
	}

	// clear values
	$('form#editTaskInput .taskInputValues .taskInputValue').remove();

	// add inputs for all <value>, <copy> and text nodes
	input.find('div.taskInputValues span').each( function () {
		var html = $('#taskInputValueSample').html();
		$('form#editTaskInput .taskInputValues').append(html);

		var thisValue = $('form#editTaskInput .taskInputValues .taskInputValue:last-child');
		thisValue.find('select[name^=value_type]').find('option[value="'+$(this).data('type')+'"]').attr('selected', 'selected');
		thisValue.find('input[name^=value]').val($(this).data('value'));
	});

	input.addClass('editing').html($('form#editTaskInput').data('xpath', input.data('xpath')));
}


function addTaskInputValue (clicked) {
	if (isInXPathHelp) return;

	$(clicked).parent().prev().append($('#taskInputValueSample').html());
}

function deleteTaskInputValue (clicked) {
	if (isInXPathHelp) return;

	clicked.parent('.taskInputValue').remove();
}

function cancelEdition () {
	if (confirm("Are you sure you want to cancel ALL ongoing changes to this workflow?"))
		executeAction('cancel');
}


$(document).delegate( 'img.startXPathHelp', 'click', function (event) {
	event.stopPropagation();
	isInXPathHelp = true;

	// highlight selectable items
	/*var currentJob = $(this);
	if (!currentJob.is('.job'))
		currentJob = currentJob.parents('.job:eq(0)');

	currentJob.parents('.job').children('.tasks').children('.task').find('.taskName').add('.parameter').addClass('xpathSelectable');*/

	var input = $(this).prev('input');
	input.data('previousValue', input.val());

	// autoselect "xpath value" in that task's dropdown
	$(this).prevAll('select[name^=value_type]').find('option[value=xpath]').attr('selected',true);

	var currentTaskOrJob = input.parents('div.task,div.job').eq(0);
	var baseXPath = xPathHelp;  // xpath expression we're willing to write will be relative to this baseXPath (parent job)

	$('div#popinMsg').text("Hover a workflow parameter or a parent task to select its value/output as input for "+currentTaskOrJob.data('type')+" '"+currentTaskOrJob.data('name')+"'").show();

	var isInLoop = currentTaskOrJob.is('.task') && currentTaskOrJob.parents('div.job:eq(0)').data('loop') != '';
	if (isInLoop)
		$('div#popinMsg').append('<p class="popinWarning">You cannot access any task output because you are in a loop, use children and attributes of the tags you are looping on.</p>');

	$('.lightTreeTask').mouseenter( function () {
		if (isInLoop) {
			input.removeClass('success').addClass('error').val("Job/task loop combinations not implemented");
			return;
		}

		input.removeClass('error success');

		var hoveredJobXPath = $(this).data('xpath').xpathParent(2);
		var commonXPath = baseXPath.substring(0,hoveredJobXPath.length);
		var extraXPath = baseXPath.substr(hoveredJobXPath.length+1);

		if (currentTaskOrJob == $(this) || commonXPath != hoveredJobXPath) {
			input.addClass('error').val("Can't access this task's output");
			return;
		}

		extraXPath = extraXPath.replace(/\w*\[\d+\]/g,'..');  // replace all 'tagName[123]' by '..'
		var resPath = extraXPath + (extraXPath?'/':'') + "tasks/task[@name='"+$(this).data('name')+"']/output/...";
		input.removeClass('error').addClass('success').val(resPath);
	});

	$('li.parameter').mouseenter( function () {
		input.removeClass('error').addClass('success').val( "/workflow/parameters/parameter[@name='"+$(this).data('name')+"']" );
	});

	$('.lightTreeTask,li.parameter').click( function (event) {
		stopXPathHelp(input);
	});
});

function stopXPathHelp (input) {
	$('.lightTreeTask,li.parameter').off('mouseenter click');
	$('.xpathSelectable').removeClass('xpathSelectable');
	$('div#popinMsg').text('').hide();

	if (input.hasClass('error')) {
		input.val( input.data('previousValue') );
	} else {
		input.focus();
		input.selectionStart = input.val().length;
	}
	$(input).removeClass('error success');

	isInXPathHelp = false;
}





$(document).ready( function () {
	updateTree();
	updateXML();
});

$(document).on('focusout', '#workflow_xml', function(){
	$.ajax({
		data:{'xml':$('#workflow_xml').val(), 'action':'updateXml', id:getId()},
		type: 'post',
		url: 'ajax/edit-session-workflow.php',
	}).done(function(result){
		updateTree();
	});
});

function updateTree() {
	$.ajax({
		data:{'id':getId(), 'mode':'tree'},
		type: 'post',
		url: 'ajax/get-workflow.php',
	}).done(function(result){
		$('#editTree').html(result);
		$(inTaskXpath).click();
	});
}
function updateXML() {
	$.ajax({
		data:{'id':getId(), 'mode':'xml'},
		type: 'post',
		url: 'ajax/get-workflow.php',
	}).done(function(result){
		$("#workflow_xml").val(result);
	});
}

function getId() {
	id = $("input[name='workflow_id']").val();
	if (id == '') {
		id = 'new';
	}
	return id;
}


$(document).on('mouseenter', '.lightTreeTasks', function(event){
	$('.edit-tree-action').hide();
	$(this).parent().children('.edit-tree-action').show();
	$(this).find('.edit-tree-action').show();
	//$(this).childrent('.edit-tree-action').show();
	event.stopPropagation();

	$(this).parent().mouseleave(function(){
		$('.edit-tree-action').hide();
		$(this).off();
	})

});


$(document).on('mouseenter', '.lightTreeNewJob', function(event){
	$('.edit-tree-action').hide();
	$(this).find('.edit-tree-action').show();
	event.stopPropagation();

	$(this).mouseleave(function(){
		$('.edit-tree-action').hide();
		$(this).off();
	})

});