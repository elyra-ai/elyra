import pandas as pd

# Update input csv files
files = ['input-1.csv', 'input-2.csv']


n=0
for file in files:
    contents = [(f'u{n+1}', f'user{n+1}'),
                (f'u{n+2}', f'user{n+2}')]
    output = pd.DataFrame(contents, columns=['userid', 'name'])
    print(output)
    output.to_csv(file, header=True, index=False)

    n=n+2

