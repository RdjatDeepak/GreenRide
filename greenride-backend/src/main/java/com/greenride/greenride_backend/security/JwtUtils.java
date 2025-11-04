package com.greenride.greenride_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
// REMOVE: import org.springframework.data.repository.query.QueryLookupStrategy; // This import is unnecessary and causing conflict
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key; // <-- Use the standard Java Key interface
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${greenride.app.jwtSecret}")
    private String jwtSecret;
    @Value("${greenride.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    public String generateJwtToken (Authentication authentication){
        UserDetails userPrincipal =(UserDetails)  authentication.getPrincipal();
        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS512) // ✅ FIX 1: Correct spelling to signWith
                .compact();
    }

    // ✅ FIX 2: Correct return type to java.security.Key
    private Key key(){
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // ✅ FIX 3: Correct return type to String (it returns the username)
    public String getUserNameFromJwtToken(String token){
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            return true;
        } catch (MalformedJwtException e) {
            // Log this error
        } catch (ExpiredJwtException e) {
            // Log this error
        } catch (UnsupportedJwtException e) {
            // Log this error
        } catch (IllegalArgumentException e) {
            // Log this error
        }
        return false;
    }
}