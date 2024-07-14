import requests
import json
import pandas as pd
import mysql.connector
import re

# MySQL 연결 설정
mydb = mysql.connector.connect(
    host="localhost",
    user="user_hk",
    password="1111",
    database="db_hk"
)

# MySQL 커서 생성
mycursor = mydb.cursor()

# 알라딘 API 키
api_key = 'ttbjeyu771001001'

# API 엔드포인트
url = 'https://www.aladin.co.kr/ttb/api/ItemList.aspx'

book_list = []

category_ids = [1, 55889, 336, 656, 170]
category_names = {
    1: "소설/시/희곡",
    55889: "에세이",
    336: "자기계발",
    656: "인문학",
    170: "경제경영"
}

for category_id in category_ids:
    params = {
        'ttbkey': api_key,
        'QueryType': 'Bestseller',
        'Cover': 'Big',
        'CategoryId': category_id,
        'MaxResults': 50,
        'start': 1,
        'SearchTarget': 'Book',
        'output': 'js',
        'Version': '20131101'
    }

    # API 호출
    res = requests.get(url, params=params)

    # 응답 데이터 확인
    if res.status_code == 200:
        data = res.json()
        items = json.loads(res.text)['item']
        for item in items:
            book_dict = {}
            book_dict['itemid'] = item['itemId']
            title = item['title'].split(' - ')[0]
            title = re.sub(r'\([^)]*\)', '', title)
            book_dict['title'] = title
            book_dict['author'] = item['author'].split(',')[0].split('(')[0]
            book_dict['categorylarge'] = category_names[category_id]
            book_dict['categorysmall'] = item['categoryName'].split('>')[2] if len(item['categoryName'].split('>')) > 2 else "UNKNOWN"
            book_dict['priceStandard'] = item['priceStandard']
            book_dict['reviewrating'] = item['customerReviewRank']
            book_dict['publisher'] = item['publisher']
            book_dict['publicationdate'] = item.get('pubDate', '')
            book_dict['coverimage'] = item['cover']
            book_dict['description'] = item['description']
            book_list.append(book_dict)

# 데이터베이스 테이블 생성
mycursor.execute("""
CREATE TABLE IF NOT EXISTS bookinfo (
    itemid VARCHAR(20) PRIMARY KEY,
    title VARCHAR(300),
    author VARCHAR(255),
    categorylarge VARCHAR(255),
    categorysmall VARCHAR(255),
    priceStandard INT,
    reviewrating FLOAT,
    publisher VARCHAR(255),
    publicationdate VARCHAR(255),
    coverimage VARCHAR(255),
    description TEXT
)
""")

for book in book_list:
    itemid = book['itemid']
    sql_check_duplicate = "SELECT itemid FROM bookinfo WHERE itemid = %s"
    mycursor.execute(sql_check_duplicate, (itemid,))
    result = mycursor.fetchone()

    if not result:  # itemid가 테이블에 존재하지 않는 경우에만 INSERT 수행
        sql_insert = """
        INSERT INTO bookinfo (itemid, title, author, categorylarge, categorysmall, 
                              priceStandard, reviewrating, publisher, publicationdate, coverimage, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        val = (book['itemid'], book['title'], book['author'], book['categorylarge'], 
               book['categorysmall'], book['priceStandard'], book['reviewrating'], 
               book['publisher'], book['publicationdate'], book['coverimage'], book['description'])
        mycursor.execute(sql_insert, val)
    else:
        print(f"Skipping duplicate entry for itemid: {itemid}")

# 변경 사항 저장
mydb.commit()

print(mycursor.rowcount, "record(s) inserted.")

# MySQL 연결 종료
mydb.close()
