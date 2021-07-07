import os
import pandas as pd
from datetime import datetime

# Update input csv files
files = ['input-1.csv', 'input-2.csv']

n=2
for file in files:
    n=n+1
    print(file)
    input = pd.read_csv(file, header=0)
    input['lastupdated'] = datetime.now()
    input.to_csv('output-'+str(n)+'.csv', index=False)
    print(input)