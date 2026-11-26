package com.jachwisunbae.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.junit.jupiter.api.extension.ExtendWith;

// 공유 MySQL 컨테이너를 쓰는 테스트 클래스에 붙인다. 클래스를 시작하기 전에 데이터를 처음 상태로 되돌린다.
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@ExtendWith(ResetDatabaseExtension.class)
public @interface ResetDatabase {
}
