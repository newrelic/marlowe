require 'rubygems'
require 'bundler/setup'
require 'rack'
require File.expand_path('../app.rb', __FILE__)
map "/data/raw" do
  run Rack::File.new(File.expand_path("../data/", __FILE__))
end
run Sinatra::Application
