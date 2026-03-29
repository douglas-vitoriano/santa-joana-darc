# plugins/builders/sw_builder.rb
#
# Zeitwerk exige que arquivos em plugins/builders/ definam
# o namespace Builders::NomeDoArquivo (em CamelCase)
#
module Builders
  class SwBuilder < SiteBuilder
    def build
      hook :site, :post_build do
        static_dir = File.join(site.config.destination, '_bridgetown', 'static')

        css_file = Dir.glob(File.join(static_dir, 'index-*.css')).first&.then do |f|
          "/_bridgetown/static/#{File.basename(f)}"
        end || ''

        js_file = Dir.glob(File.join(static_dir, 'index-*.js')).first&.then do |f|
          "/_bridgetown/static/#{File.basename(f)}"
        end || ''

        sw_source = File.join(site.config.source, 'sw.js')

        unless File.exist?(sw_source)
          Bridgetown.logger.warn 'SwBuilder:', "sw.js não encontrado em #{sw_source}"
          next
        end

        sw_content = File.read(sw_source)
        sw_content.gsub!('__CSS_FILE__', css_file)
        sw_content.gsub!('__JS_FILE__', js_file)

        sw_output = File.join(site.config.destination, 'sw.js')
        File.write(sw_output, sw_content)

        Bridgetown.logger.info 'SwBuilder:', \
          "sw.js gerado → CSS: #{css_file.empty? ? '(não encontrado)' : css_file}" \
          ", JS: #{js_file.empty? ? '(não encontrado)' : js_file}"
      end
    end
  end
end
