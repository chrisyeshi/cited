require 'anystyle'
require 'json'

output = AnyStyle.parse ARGV
puts output.to_json
