import urllib.request, re, time, json, os, html
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
feeds=[l.strip() for l in open('feeds.txt') if l.strip()]
idx=json.load(open('rd/index.json')) if os.path.exists('rd/index.json') else {}
for f in feeds:
    for t in range(4):
        try:
            req=urllib.request.Request('https://www.reddit.com/'+f,headers={'User-Agent':UA})
            x=urllib.request.urlopen(req,timeout=30).read().decode('utf8'); break
        except Exception as e:
            print('retry',f,e,flush=True); time.sleep(30); x=''
    for e in re.findall(r'<entry>(.*?)</entry>',x,re.S):
        title=html.unescape(re.search(r'<title>(.*?)</title>',e,re.S).group(1))
        link=re.search(r'<link href="([^"]+)"',e).group(1)
        for u in sorted(set(re.findall(r'https://i\.redd\.it/[a-z0-9]+\.(?:png|jpg|jpeg)',e))):
            idx[u]={'title':title,'post':link,'feed':f}
    print(f, len(idx), flush=True)
    json.dump(idx,open('rd/index.json','w'),indent=1)
    time.sleep(12)
