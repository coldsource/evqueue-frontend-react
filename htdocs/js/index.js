var search_filters = {
	status:'terminated'
};

$(document).ready(function() {
	$('#executing-workflows-pannel .fa-rocket').click(function() {
		$('#workflow-launch').dialog({width:'auto',height:'auto'});
	});
	
	$('#executing-workflows-pannel .fa-clock-o').click(function() {
		evqueueAPI({
			confirm: 'The retry counter of each task in error will be decremented. Continue ?',
			group: 'control',
			action: 'retry',
			attributes: {}
		}).done(function(xml) {
			Message("Retrying all tasks");
		});
	});
	
	$(document).delegate('#terminated-workflows-pannel .fa-remove','click',function() {
		var instance_id = $(this).parents('tr').data('id');
		evqueueAPI({
			confirm: 'You are about to delete instance '+instance_id,
			group: 'instance',
			action: 'delete',
			attributes: { 'id':instance_id }
		}).done( function () {
			$('#terminated-workflows-pannel').evqautorefresh('refresh');
			Message('Instance '+instance_id+' removed');
		});
	});
	
	$(document).delegate('#executing-workflows-pannel .fa-ban','click',function() {
		if(!confirm("You are about to cancel this instance.\n\nRunning tasks will continue to run normally but no new task will be launched.\n\nRetry schedules will be disabled."))
			return;
		
		CancelInstance($(this).parents('tr').data('id'),$(this).parents('tr').data('node'),false);
	});
	
	$(document).delegate('#executing-workflows-pannel .fa-bomb','click',function() {
		if(!confirm("You are about to kill this instance.\n\nRunning tasks will be killed with SIGKILL and workflow will end immediately.\n\nThis can lead to inconsistancies in running tasks."))
			return;
		
		CancelInstance($(this).parents('tr').data('id'),$(this).parents('tr').data('node'),true);
	});
	
	$('#workflow-launch select[name=workflow_id').change(function(event,schedule_xml) {
		$('#which_workflow form .parameter').remove();
		
		if($(this).val()=='')
			return;
		
		evqueueAPI({
			group: 'workflow',
			action: 'get',
			attributes: {id: $(this).val()}
		}).done(function(xml) {
			$(xml).find('parameter').each(function() {
				$('#which_workflow form').append('<div class="parameter"><label>'+$(this).attr('name')+'</label><input name="parameter_'+$(this).attr('name')+'"></input></div>');
			});
			
			$(schedule_xml).find('parameter').each(function() {
				$('#which_workflow form input[name=parameter_'+$(this).attr('name')+']').val($(this).attr('value'));
			});
		});
	});
	
	$('#workflow-launch .submit').click(function() {
		var workflow_id = $('#workflow-launch select[name=workflow_id').val();
		var workflow_parameters = {};
		$('#which_workflow form .parameter input').each(function() {
			console.log($(this).val());
			workflow_parameters[$(this).attr('name').substr(10)] = $(this).val();
		});
		
		evqueueAPI({
			group: 'workflow',
			action: 'get',
			attributes: {id: workflow_id}
		}).done(function(xml) {
			var workflow_name = xml.documentElement.firstChild.getAttribute('name');
			
			evqueueAPI({
				group: 'instance',
				action: 'launch',
				attributes: {name:workflow_name},
				parameters: workflow_parameters
			}).done(function(xml) {
				var instance_id = xml.documentElement.getAttribute('workflow-instance-id');
				$('#workflow-launch').dialog('close');
				Message('Launched instance '+instance_id);
			});
		});
	});
	
	// Search form
	$('#searchform select[name=node]').change(function() {
		if($(this).val())
			search_filters.filter_node = $(this).val();
		else
			delete search_filters.filter_node;
		
		UpdateFilters();
	});
	
	$('#searchform select[name=wf_name]').change(function() {
		$('#searchform .parameter').remove();
		
		if($(this).val()=='')
			delete search_filters.filter_workflow;
		else
		{
			var wfname = $(this).find("option:selected").text();
			var wfid = $(this).val();
			
			search_filters.filter_workflow = wfname;
			
			evqueueAPI({
				group: 'workflow',
				action: 'get',
				attributes: {id: $(this).val()}
			}).done(function(xml) {
				$(xml).find('parameter').each(function() {
					$('<div class="parameter"><label>'+$(this).attr('name')+'</label><input name="parameter_'+$(this).attr('name')+'"></input></div>').insertAfter('#searchworkflow');
				});
			});
		}
		
		UpdateFilters();
	});
	
	$('#searchform').delegate('.parameter','change',function() {
		UpdateFilters();
	});
	
	$('#dt_inf,#hr_inf').on('change autocompletechange',function() {
		if($('#dt_inf').val())
		{
			search_filters.filter_launched_from = $('#dt_inf').val()+' '+($('#hr_inf').val()!=''?($('#hr_inf').val()+':00'):'00:00:00');
		}
		else
			delete search_filters.filter_launched_from;
		
		UpdateFilters();
	});
	
	$('#dt_sup,#hr_sup').on('change autocompletechange',function() {
		if($('#dt_sup').val())
		{
			search_filters.filter_launched_until = $('#dt_sup').val()+' '+($('#hr_sup').val()!=''?($('#hr_sup').val()+':00'):'23:59:59');
		}
		else
			delete search_filters.filter_launched_until;
		
		
		UpdateFilters();
	});
	
	$('#terminated-workflows-pannel .fa-exclamation').click(function() {
		$(this).toggleClass('error');
		
		if($(this).hasClass('error'))
		{
			$(this).attr('title','Display all workflows');
			search_filters.filter_error = 1;
		}
		else
		{
			$(this).attr('title','Display only failed workflows');
			delete search_filters.filter_error;
		}
		
		UpdateFilters();
	});
	
	$('#clearfilters').click(function() {
		$('#searchform select[name=node]').val('');
		$('#searchform select[name=wf_name]').val('').trigger('change.select2');;
		$('#dt_inf').val('');
		$('#hr_inf').val('');
		$('#dt_sup').val('');
		$('#hr_sup').val('');
		if($('#terminated-workflows-pannel .fa-exclamation').hasClass('error'))
			$('#terminated-workflows-pannel .fa-exclamation').click();
		
		search_filters = { status:'terminated' };
		UpdateFilters();
		$('#searchformcontainer .filter').hide();
	});
});

function UpdateFilters()
{
	var url = "ajax/list-instances.php?";
	url += jQuery.param(search_filters);
	
	var parameters = {};
	$('#searchform input').each(function() {
		if($(this).attr('name').substr(0,10)=='parameter_' && $(this).val()!='')
			parameters[$(this).attr('name')] = $(this).val();
	});
	if(Object.keys(parameters).length)
		url += "&" + jQuery.param(parameters);
	
	$('#terminated-workflows-pannel').data('url',url);
	$('#terminated-workflows-pannel').evqautorefresh('refresh');
	
	var explain;
	if(Object.keys(search_filters).length==1)
	{
		explain = 'Showing all terminated workflows';
		$('#clearfilters').hide();
	}
	else
	{
		if(search_filters.filter_error)
			explain = 'Showing failed ';
		else
			explain = 'Showing terminated ';
		
		explain += (search_filters.filter_workflow?' <i>'+search_filters.filter_workflow+'</i> ':'')+'workflows';
		if(search_filters.filter_launched_from && search_filters.filter_launched_until)
			explain += ' between '+search_filters.filter_launched_from+' and '+search_filters.filter_launched_until;
		else if(search_filters.filter_launched_from)
			explain += ' since '+search_filters.filter_launched_from;
		else if(search_filters.filter_launched_until)
			explain += ' before '+search_filters.filter_launched_until;
		
		var i = 0;
		if(Object.keys(parameters).length)
		{
			explain += ' having ';
			for(var param in parameters)
			{
				if(i>0)
					explain += ', ';
				explain+= param.substr(10)+'='+parameters[param];
				i++;
			}
		}
		
		if(search_filters.filter_node)
			explain += ' on node '+search_filters.filter_node;
		
		$('#clearfilters').show();
	}
	
	$('#searchexplain').html(explain);
	
	Message('Filters updated');
}