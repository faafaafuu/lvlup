Pod::Spec.new do |s|
  s.name           = 'HrumActivity'
  s.version        = '0.1.0'
  s.summary        = 'Live Activity Хрума (Dynamic Island)'
  s.author         = 'faraday13'
  s.homepage       = 'https://github.com/faafaafuu/lvlup'
  s.license        = 'MIT'
  s.platforms      = { :ios => '16.2' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.swift_version = '5.9'
end
