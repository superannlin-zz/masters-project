import requests
import csv

r = csv.reader(open('stoplist.csv'))
# w = csv.writer(open('output.csv','w'))
w = csv.writer(open('stopsoutput.csv','w'))

headers = r.next()
headers.append('coordinates')
headers.append('lat')
headers.append('long')
w.writerow(headers)

counter = 1
for line in r:
	addr = line[0].replace(' ','+')
	response = requests.get('https://maps.googleapis.com/maps/api/geocode/json?address='+addr+',+San+Francisco,+CA&key=AIzaSyAgnZhnWbastfHxtW4ToCSO_tcXCguHSDI')
	resp_json_payload = response.json()

	if not(len(resp_json_payload['results']) == 0):
		coord = (resp_json_payload['results'][0]['geometry']['location'])
		line.append(coord)
		line.append(coord['lat'])
		line.append(coord['lng'])
		w.writerow(line)
	else:
		line.append(None)
		line.append(None)
		line.append(None)
		w.writerow(line)
	print counter
	counter = counter + 1
	# if counter == 0:
	# 	break
	# counter = counter -1


response = requests.get('https://maps.googleapis.com/maps/api/geocode/json?address=1962+Bellomy+Street,+santa+clara,+CA')
# resp_json_payload = response.json()

# print(resp_json_payload['results'][0]['geometry']['location'])