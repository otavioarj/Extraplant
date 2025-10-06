# 🌱 Extraplant

**Transforming farmers into agents of planetary regeneration through science and technology.**

---

## About

Our planet's resources are limited — and unsustainable agricultural practices threaten global food production.

**Extraplant presents a sustainable solution.**

Using historical climate data from NASA and the UN's AquaCrop model, the app works as a real crop simulator that teaches, in an interactive and gamified way, how to achieve larger and better harvests while preserving soil and biodiversity.

Validated in numerous studies, the model achieves up to 98% accuracy when calibrated for local conditions.

By combining technology, science, and sustainability, Extraplant transforms producers into protagonists of planetary regeneration.

---

## Features

- 🌍 **Global Coverage**: Simulate crops in 22 regions across 6 continents
- 📊 **Scientific Accuracy**: Based on FAO's AquaCrop-OS model (up to 98% precision)
- 🛰️ **Real Climate Data**: Powered by NASA POWER API
- 🌾 **Multiple Crops**: Support for Maize, Wheat, Rice, Cotton, Potato, and more
- 💧 **Water Efficiency**: Optimize irrigation strategies and water usage
- 📈 **Performance Metrics**: Track biomass, yield, and soil water balance

---

## Technology Stack

- **Backend**: AWS Lambda (Python 3.11)
- **Container**: Docker with ECR deployment
- **Climate Data**: NASA POWER API
- **Crop Model**: AquaCrop-OSPy v3.0.11
- **Infrastructure**: Serverless architecture (AWS Free Tier compatible)

---

## API Overview

### Endpoint

```
POST https://wmjhsuoycqmjacablbpjyyzxwq0uohnz.lambda-url.us-east-1.on.aws/
```

### Request

```bash
curl -X POST https://wmjhsuoycqmjacablbpjyyzxwq0uohnz.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "regiao": 60,
    "dt_i": "2024-10-15",
    "dt_f": "2025-03-15",
    "daily": false,
    "agua": "FC",
    "crop": "Maize"
  }'
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `regiao` | integer | ✅ Yes | - | Region ID (see available regions below) |
| `dt_i` | string | ✅ Yes | - | Start date (format: `YYYY-MM-DD`) |
| `dt_f` | string | ✅ Yes | - | End date (format: `YYYY-MM-DD`) |
| `daily` | boolean | ❌ No | `true` | Daily data if `true`, weekly if `false` |
| `agua` | string | ❌ No | `"FC"` | Initial soil water content (`"FC"`, `"WP"`, `"SAT"`) |
| `crop` | string | ❌ No | `"Maize"` | Crop type |

### Response

```json
{
  "crescimento": [
    {
      "alt_cm": 10.5,
      "bio_ton": 0.15
    },
    {
      "alt_cm": 25.3,
      "bio_ton": 0.42
    }
  ],
  "solo": {
    "regiao": "Darling Downs-Queensland",
    "infilt": 450.2,
    "escoa": 23.1,
    "percol": 125.4,
    "stress": 15.8,
    "efic": 2.45,
    "prod": 8.75
  }
}
```

### Available Regions

#### Brazil
- `1` - Uberlândia-MG (SandyLoam)
- `10` - Santarém-PA (ClayLoam)
- `11` - Ji-Paraná-RO (Clay)
- `12` - Sinop-MT (SandyClayLoam)

#### Africa (Sahel)
- `20` - Kano-Nigeria (SandyLoam)
- `21` - Zinder-Niger (Sand)
- `22` - Ouagadougou-Burkina Faso (SandyLoam)

#### Asia
- `30` - Punjab-India (SiltLoam)
- `31` - Uttar Pradesh-India (ClayLoam)
- `32` - Central Luzon-Philippines (Clay)
- `33` - Mekong Delta-Vietnam (Clay)

#### Europe
- `40` - Flevopolder-Netherlands (ClayLoam)
- `41` - Beauce-France (SiltLoam)
- `42` - Champagne-France (SiltClayLoam)

#### North America
- `50` - Iowa-USA (Corn Belt) (SiltLoam)
- `51` - Illinois-USA (SiltLoam)
- `52` - Nebraska-USA (SiltClayLoam)
- `53` - Kansas-USA (SiltLoam)

#### Oceania
- `60` - Darling Downs-Queensland (Clay)
- `61` - Riverina-NSW (ClayLoam)
- `62` - Esperance-Western Australia (SandyLoam)

### Supported Crops

- Maize
- Wheat
- Rice
- Cotton
- Potato
- Tomato
- Soybean

For complete crop list, see [AquaCrop-OSPy documentation](https://aquacropos.github.io/aquacrop/).

---

## Quick Start

### Prerequisites

- Docker
- AWS Account (Free Tier)
- AWS CLI configured

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/otavioarj/Extraplant.git
cd extraplant
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run locally**
```bash
python lambda_function.py
```

### Deployment

1. **Build Docker image**
```bash
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  --load \
  -t aquacrop-lambda:latest \
  .
```

2. **Push to ECR**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag aquacrop-lambda:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/aquacrop-lambda:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/aquacrop-lambda:latest
```

3. **Create Lambda Function**
```bash
aws lambda create-function \
  --function-name aquacrop-api \
  --package-type Image \
  --code ImageUri=<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/aquacrop-lambda@<DIGEST> \
  --role arn:aws:iam::<ACCOUNT_ID>:role/lambda-execution-role \
  --timeout 300 \
  --memory-size 1024 \
  --region us-east-1
```

4. **Create Function URL**
```bash
aws lambda create-function-url-config \
  --function-name aquacrop-api \
  --auth-type NONE \
  --cors AllowOrigins="*",AllowMethods="POST",AllowHeaders="content-type" \
  --region us-east-1
```

---

## Usage Examples

### JavaScript/TypeScript

```javascript
fetch('https://your-function-url.lambda-url.us-east-1.on.aws/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    regiao: 60,
    dt_i: "2024-10-15",
    dt_f: "2025-03-15",
    daily: false,
    agua: "FC",
    crop: "Maize"
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Python

```python
import requests

response = requests.post(
    'https://your-function-url.lambda-url.us-east-1.on.aws/',
    json={
        "regiao": 60,
        "dt_i": "2024-10-15",
        "dt_f": "2025-03-15",
        "daily": False,
        "agua": "FC",
        "crop": "Maize"
    }
)

print(response.json())
```

---

## Understanding Results

### Water Use Efficiency (`efic`)
- **> 2.0 kg/m³**: Excellent efficiency
- **1.5 - 2.0 kg/m³**: Good efficiency
- **< 1.5 kg/m³**: Low efficiency (possible water stress)

### Water Stress (`stress`)
- **< 50 mm**: Minimal stress
- **50-150 mm**: Moderate stress
- **> 150 mm**: Severe stress (compromised yield)

### Yield (`prod`)
Typical good yields:
- **Maize**: 8-12 ton/ha
- **Wheat**: 4-6 ton/ha
- **Rice**: 6-9 ton/ha

---

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP POST
       ▼
┌─────────────────────┐
│  Lambda Function    │
│  (Python 3.11)      │
└──────┬──────────────┘
       │
       ├─► NASA POWER API (Climate Data)
       │
       ├─► AquaCrop Model (Simulation)
       │
       └─► [Future] DynamoDB (Cache)
```

---

## Future Enhancements

- [ ] DynamoDB caching for climate data
- [ ] Multi-year climate projections
- [ ] Irrigation schedule optimization
- [ ] Fertilization recommendations
- [ ] Pest and disease risk assessment
- [ ] Economic analysis module
- [ ] Mobile app integration

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **FAO AquaCrop**: For the crop-water model
- **NASA POWER**: For climate data API
- **AquaCrop-OSPy**: Python implementation by Tim Foster et al.
- **University of Manchester**: Agriculture, Water and Climate research group

---

## References

- [AquaCrop-OSPy Documentation](https://aquacropos.github.io/aquacrop/)
- [FAO AquaCrop](http://www.fao.org/aquacrop/)
- [NASA POWER API](https://power.larc.nasa.gov/)

---
