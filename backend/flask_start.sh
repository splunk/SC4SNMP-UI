set -o errexit
set -o nounset
cd /app
gunicorn -b :5000 app:flask_app --log-level INFO