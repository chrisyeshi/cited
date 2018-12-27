require 'anystyle'
require 'json'

output = AnyStyle.parse [
  'Derrida, J. (1967). L’écriture et la différence (1 éd.). Paris: Éditions du Seuil.',
  'Poe, Edgar A. Essays and Reviews. New York: Library of America, 1984.'
]

puts output.to_json
