from flask import Flask, jsonify, request
from scraper import PriceTracker

app = Flask(__name__)
tracker = PriceTracker()

@app.route('/history', methods=['GET'])
def get_history():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'url parameter required'}), 400
    history = tracker.get_history(url)
    return jsonify({'history': [{'price': p, 'date': d} for p, d in history]})

@app.route('/track', methods=['POST'])
def track_product():
    data = request.json
    tracker.track(data['url'], data['name'], data.get('threshold'))
    return jsonify({'status': 'tracked'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
