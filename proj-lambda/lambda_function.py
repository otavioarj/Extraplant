import json
import requests
import pandas as pd
from datetime import datetime
from aquacrop import AquaCropModel, Soil, Crop, InitialWaterContent

# Configurações de regiões
REGIOES = {
    1: {'nome': 'Uberlândia-MG', 'lat': -18.9186, 'lon': -48.2772, 'solo': 'SandyLoam'},
    10: {'nome': 'Santarém-PA', 'lat': -2.4419, 'lon': -54.7083, 'solo': 'ClayLoam'},
    11: {'nome': 'Ji-Paraná-RO', 'lat': -10.8828, 'lon': -61.9519, 'solo': 'Clay'},
    12: {'nome': 'Sinop-MT (Transição)', 'lat': -11.8644, 'lon': -55.5047, 'solo': 'SandyClayLoam'},
    20: {'nome': 'Kano-Nigéria', 'lat': 12.0022, 'lon': 8.5919, 'solo': 'SandyLoam'},
    21: {'nome': 'Zinder-Níger', 'lat': 13.8069, 'lon': 8.9883, 'solo': 'Sand'},
    22: {'nome': 'Ouagadougou-Burkina Faso', 'lat': 12.3714, 'lon': -1.5197, 'solo': 'SandyLoam'},
    30: {'nome': 'Punjab-Índia', 'lat': 30.9010, 'lon': 75.8573, 'solo': 'SiltLoam'},
    31: {'nome': 'Uttar Pradesh-Índia', 'lat': 26.8467, 'lon': 80.9462, 'solo': 'ClayLoam'},
    32: {'nome': 'Central Luzon-Filipinas', 'lat': 15.4817, 'lon': 120.7119, 'solo': 'Clay'},
    33: {'nome': 'Delta do Mekong-Vietnã', 'lat': 10.0452, 'lon': 105.7469, 'solo': 'Clay'},
    40: {'nome': 'Flevopolder-Holanda', 'lat': 52.5186, 'lon': 5.4714, 'solo': 'ClayLoam'},
    41: {'nome': 'Beauce-França', 'lat': 48.4167, 'lon': 1.6333, 'solo': 'SiltLoam'},
    42: {'nome': 'Champagne-França', 'lat': 49.0431, 'lon': 4.3625, 'solo': 'SiltClayLoam'},
    50: {'nome': 'Iowa-EUA (Corn Belt)', 'lat': 42.0308, 'lon': -93.6319, 'solo': 'SiltLoam'},
    51: {'nome': 'Illinois-EUA', 'lat': 40.6331, 'lon': -89.3985, 'solo': 'SiltLoam'},
    52: {'nome': 'Nebraska-EUA', 'lat': 41.4925, 'lon': -99.9018, 'solo': 'SiltClayLoam'},
    53: {'nome': 'Kansas-EUA', 'lat': 38.5266, 'lon': -96.7265, 'solo': 'SiltLoam'},
    60: {'nome': 'Darling Downs-Queensland', 'lat': -27.5598, 'lon': 151.9507, 'solo': 'Clay'},
    61: {'nome': 'Riverina-NSW', 'lat': -34.7088, 'lon': 146.0242, 'solo': 'ClayLoam'},
    62: {'nome': 'Esperance-Western Australia', 'lat': -33.8614, 'lon': 121.8917, 'solo': 'SandyLoam'},
}


def buscar_dados_nasa_power(latitude, longitude, data_inicio, data_fim):
    """
    Busca dados climáticos da NASA POWER API.
    
    TODO: FUTURO - DynamoDB Cache
    1. Verificar se dados existem no DynamoDB (PK: lat_lon, SK: period)
    2. Se existir, retornar do cache
    3. Se não existir, buscar da NASA e salvar no DynamoDB
    """
    parametros = ['T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN']
    
    base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        'parameters': ','.join(parametros),
        'community': 'AG',
        'longitude': longitude,
        'latitude': latitude,
        'start': data_inicio.replace('-', ''),
        'end': data_fim.replace('-', ''),
        'format': 'JSON'
    }
    
    response = requests.get(base_url, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    
    parametros_data = data['properties']['parameter']
    
    temp_max = list(parametros_data['T2M_MAX'].values())
    temp_min = list(parametros_data['T2M_MIN'].values())
    precip = list(parametros_data['PRECTOTCORR'].values())
    rad = list(parametros_data['ALLSKY_SFC_SW_DWN'].values())
    
    et0 = [0.0023 * ((tmax + tmin)/2 + 17.8) * ((tmax - tmin)**0.5) * (r * 0.408) 
           for tmax, tmin, r in zip(temp_max, temp_min, rad)]
    
    df = pd.DataFrame({
        'MinTemp': temp_min,
        'MaxTemp': temp_max,
        'Precipitation': precip,
        'ReferenceET': et0,
        'Date': pd.to_datetime(list(parametros_data['T2M_MAX'].keys()), format='%Y%m%d')
    })
    
    # TODO: Salvar no DynamoDB após buscar da NASA
    
    return df


def simular_crescimento(regiao, dt_i, dt_f, daily=True, agua="FC", crop="Maize"):
    """Simula o crescimento de uma cultura usando AquaCrop."""
    if regiao not in REGIOES:
        raise ValueError(f"Região {regiao} não existe. Regiões válidas: {list(REGIOES.keys())}")
    
    reg = REGIOES[regiao]
    weather = buscar_dados_nasa_power(reg['lat'], reg['lon'], dt_i, dt_f)
    
    modelo = AquaCropModel(
        sim_start_time=dt_i.replace('-', '/'),
        sim_end_time=dt_f.replace('-', '/'),
        weather_df=weather,
        soil=Soil(soil_type=reg['solo']),
        crop=Crop(crop, planting_date=dt_i.split('-')[1] + '/' + dt_i.split('-')[2]),
        initial_water_content=InitialWaterContent(value=[agua])
    )
    
    modelo.run_model(till_termination=True)
    cg = modelo._outputs.crop_growth
    wf = modelo._outputs.water_flux
    fs = modelo._outputs.final_stats
    
    fim = cg[cg['biomass'] > 0].index.max()
    
    if daily:
        res = pd.DataFrame({
            'alt_cm': (cg['z_root'] * 100).round(1),
            'bio_ton': (cg['biomass'] / 1000).round(2)
        }).iloc[:fim + 1]
    else:
        cg['week'] = (cg.index // 7) + 1
        w = cg.groupby('week').agg({'z_root': 'last', 'biomass': 'last'}).reset_index()
        res = pd.DataFrame({
            'alt_cm': (w['z_root'] * 100).round(1),
            'bio_ton': (w['biomass'] / 1000).round(2)
        })
        res = res[res.index < (fim // 7) + 1]
    
    tr_sum = wf['Tr'].sum()
    
    solo = {
        'regiao': reg['nome'],
        'infilt': round(wf['Infl'].sum(), 1),
        'escoa': round(wf['Runoff'].sum(), 1),
        'percol': round(wf['DeepPerc'].sum(), 1),
        'stress': round(wf['TrPot'].sum() - tr_sum, 1),
        'efic': round((fs.iloc[0, 4] / tr_sum * 100), 2) if tr_sum > 0 else 0,
        'prod': round(fs.iloc[0, 4], 2) if len(fs) > 0 else 0
    }
    
    # Converter DataFrame para lista de dicts para JSON
    crescimento_list = res.to_dict('records')
    
    return crescimento_list, solo


def lambda_handler(event, context):
    """
    Handler principal da Lambda Function.
    
    Espera um POST com JSON,p.ex.:
    {
        "regiao": 60,
        "dt_i": "2024-10-15",
        "dt_f": "2025-10-03",
        "daily": false,
        "agua": "FC",
        "crop": "Maize"
    }
    """
    try:
        # Parse do body (pode vir como string ou dict)
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        # Extrair parâmetros com valores padrão
        regiao = body.get('regiao')
        dt_i = body.get('dt_i')
        dt_f = body.get('dt_f')
        daily = body.get('daily', True)
        agua = body.get('agua', 'FC')
        crop = body.get('crop', 'Maize')
        
        # Validações básicas
        if regiao is None:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Parâmetro "regiao" é obrigatório',
                    'regioes_validas': list(REGIOES.keys())
                })
            }
        
        if not dt_i or not dt_f:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Parâmetros "dt_i" e "dt_f" são obrigatórios',
                    'formato': 'YYYY-MM-DD'
                })
            }
        
        # Validar formato de data
        try:
            datetime.strptime(dt_i, '%Y-%m-%d')
            datetime.strptime(dt_f, '%Y-%m-%d')
        except ValueError:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Formato de data inválido. Use YYYY-MM-DD'
                })
            }
        
        # Executar simulação
        crescimento, solo = simular_crescimento(
            regiao=int(regiao),
            dt_i=dt_i,
            dt_f=dt_f,
            daily=daily,
            agua=agua,
            crop=crop
        )
        
        # Retornar resultado
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
               # 'Access-Control-Allow-Origin': '*'  # CORS configurado no function-url-config
            },
            'body': json.dumps({
                'crescimento': crescimento,
                'solo': solo
            }, ensure_ascii=False)
        }
        
    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e)
            })
        }
    
    except requests.exceptions.RequestException as e:
        return {
            'statusCode': 502,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Erro ao buscar dados da NASA API',
                'details': str(e)
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Erro interno do servidor',
                'details': str(e)
            })
        }
