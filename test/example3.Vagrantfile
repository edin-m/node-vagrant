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

  

  

  
  
  config.vm.define "web" do |web|
    web.vm.box = "apache"
  end
  
  config.vm.define "db", primary: true do |db|
    db.vm.box = "mysql"
  end
  
  config.vm.define "db_follower", autostart: false do |db_follower|
    db_follower.vm.box = "mysql"
  end
  
  

  

  
end
