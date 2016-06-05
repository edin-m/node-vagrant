<% _.forEach(settings.commands, function(command) { %>
    <%= provisionerAlias %>.<%=command %>
<% }); %>
