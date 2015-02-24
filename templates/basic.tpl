# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  <% _.forEach(config.vm, function(value, key) { %>
  config.vm.<%=key%> = "<%=value%>"
  <% }); %>

  <% _.forEach(config.networks, function(network) { 
      %>config.vm.network "<%= network.type %>"<% _.forEach(network.detail, function(value, key) { %>, <%= key %>: <% if(typeof value === 'string') { %>"<%=value%>"<% } else { %><%=value%><% } %><% }); %>
  <% }); %>

  <% if(typeof config.providers.virtualbox !== 'undefined') { %>
  config.vm.provider "virtualbox" do |vb|
    <% _.forEach(config.providers.virtualbox, function(value, name) { %>
    vb.<%= name %> = <%= value %>
    <% }); %>
  end
  <% }; %>

end
