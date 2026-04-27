class SpaController < ApplicationController
  # Serves the built React SPA's index.html for any /app/* route.
  # In dev you'll usually run Vite directly at http://localhost:5173.
  def index
    path = Rails.root.join("public/app/index.html")
    if File.exist?(path)
      render file: path, layout: false, content_type: "text/html"
    else
      render plain: "React SPA not built yet. Run `cd client && npm run build`, " \
                    "or use http://localhost:5173 in development.",
             status: :ok
    end
  end
end
