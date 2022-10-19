FROM python:3.9
WORKDIR /app

COPY requirements.txt app.py ./
RUN pip install -r ./requirements.txt
ENV FLASK_DEBUG production

EXPOSE 5000
CMD ["gunicorn", "-b", ":5000", "app:app"]